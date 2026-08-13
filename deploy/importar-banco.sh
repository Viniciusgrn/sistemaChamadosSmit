#!/bin/bash
# Importa o pacote gerado por exportar-banco.sh. Roda NA VPS, na raiz do repo:
#
#   bash deploy/importar-banco.sh /root/banco-AAAAMMDD-HHMM.sql.gz [/root/media-....tar.gz]
#
# Detecta sozinho se a stack está em compose ou em swarm.
set -euo pipefail

cd "$(dirname "$0")/.."

DUMP="${1:-}"
MEDIA="${2:-}"

if [ -z "$DUMP" ] || [ ! -f "$DUMP" ]; then
  echo "Uso: bash deploy/importar-banco.sh <dump.sql.gz> [media.tar.gz]" >&2
  exit 1
fi

[ -f .env ] && { set -a; . ./.env; set +a; }
DB_NAME="${DB_NAME:-sistema_chamados}"

# --- onde está rodando? --------------------------------------------------
if docker stack ls 2>/dev/null | grep -q '^chamados '; then
  MODO=swarm
  CID_DB="$(docker ps -q -f name=chamados_db)"
  senha_root() { docker exec "$CID_DB" cat /run/secrets/db_root_password; }
  parar_backend() { docker service scale chamados_backend=0; }
  subir_backend() { docker service scale chamados_backend=2; }
  cid_backend() { docker ps -q -f name=chamados_backend | head -1; }
else
  MODO=compose
  CID_DB="$(docker compose ps -q db)"
  senha_root() { printf '%s' "${DB_ROOT_PASSWORD}"; }
  parar_backend() { docker compose stop backend; }
  subir_backend() { docker compose start backend; }
  cid_backend() { docker compose ps -q backend; }
fi

if [ -z "$CID_DB" ]; then
  echo "Container do MySQL não está no ar. Suba a stack antes." >&2
  exit 1
fi
echo "==> Modo detectado: $MODO"

ROOT_PASS="$(senha_root)"

# --- backup do que já está lá (nunca sobrescrever sem rede de segurança) ---
mkdir -p deploy/dump
ANTES="deploy/dump/antes-da-importacao-$(date +%Y%m%d-%H%M).sql.gz"
echo "==> Backup do banco atual em $ANTES"
docker exec "$CID_DB" mysqldump -u root -p"$ROOT_PASS" \
  --single-transaction --no-tablespaces --set-gtid-purged=OFF \
  "$DB_NAME" 2>/dev/null | gzip > "$ANTES" || echo "    (banco ainda vazio — seguindo)"

# --- o backend não pode escrever durante a troca ---------------------------
echo "==> Parando o backend"
parar_backend

echo "==> Recriando o schema '$DB_NAME'"
# DROP + CREATE em vez de importar por cima: sem isso as tabelas criadas pelo
# migrate colidem com as do dump e a importação morre no meio.
docker exec -i "$CID_DB" mysql -u root -p"$ROOT_PASS" -e \
  "DROP DATABASE IF EXISTS \`$DB_NAME\`;
   CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "==> Importando $DUMP"
gunzip -c "$DUMP" | docker exec -i "$CID_DB" \
  mysql -u root -p"$ROOT_PASS" --default-character-set=utf8mb4 "$DB_NAME"

# ---------------------------------------------------------------------------
# Maiúsculas nos nomes de tabela.
#
# O MySQL do Windows roda com lower_case_table_names=1 e grava TODO nome de
# tabela em minúsculas; o do Linux é sensível a maiúsculas. Como o app_label
# 'equipeTecnica' tem T maiúsculo, o Django procura 'equipeTecnica_tecnico' e
# encontra 'equipetecnica_tecnico' — resultado: "Table doesn't exist" só nesse
# app, com o resto do banco aparentemente perfeito.
# ---------------------------------------------------------------------------
echo "==> Conferindo maiúsculas dos nomes de tabela"
docker exec -i "$CID_DB" mysql -u root -p"$ROOT_PASS" "$DB_NAME" 2>/dev/null <<'SQL' || true
SET @lc := @@lower_case_table_names;
SELECT IF(@lc = 0, 'banco sensivel a maiusculas - renomeando se preciso',
                   'banco insensivel a maiusculas - nada a fazer') AS status;
SQL

for par in \
  "equipetecnica_tecnico:equipeTecnica_tecnico" \
  "equipetecnica_equipe:equipeTecnica_equipe" \
  "equipetecnica_atendimento:equipeTecnica_atendimento" \
  "equipetecnica_participacaoequipe:equipeTecnica_participacaoequipe" \
  "equipetecnica_responsabilidadetecnico:equipeTecnica_responsabilidadetecnico"
do
  origem="${par%%:*}"; destino="${par##*:}"
  # só renomeia se a minúscula existir E a com maiúscula não
  docker exec -i "$CID_DB" mysql -u root -p"$ROOT_PASS" "$DB_NAME" 2>/dev/null <<SQL || true
SET @tem_origem := (SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_schema = '$DB_NAME' AND table_name = '$origem' COLLATE utf8mb4_bin);
SET @tem_destino := (SELECT COUNT(*) FROM information_schema.tables
                     WHERE table_schema = '$DB_NAME' AND table_name = '$destino' COLLATE utf8mb4_bin);
SET @sql := IF(@tem_origem = 1 AND @tem_destino = 0,
               'RENAME TABLE \`$origem\` TO \`$destino\`',
               'DO 0');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
SQL
done

echo "==> Subindo o backend"
subir_backend
sleep 15   # o entrypoint espera o banco e roda migrate antes de servir

# --- uploads ---------------------------------------------------------------
if [ -n "$MEDIA" ] && [ -f "$MEDIA" ]; then
  CID_BACK="$(cid_backend)"
  if [ -n "$CID_BACK" ]; then
    echo "==> Restaurando uploads"
    tar -xzf "$MEDIA" -C /tmp                 # gera /tmp/media
    docker cp /tmp/media/. "$CID_BACK:/app/media/"
    # docker cp preserva o dono da origem (root). O Django roda como 'django':
    # sem isto ele lê as plantas antigas mas não consegue substituí-las.
    docker exec -u root "$CID_BACK" chown -R django:django /app/media
    rm -rf /tmp/media
  else
    echo "!! Backend ainda subindo — copie os uploads depois:" >&2
    echo "   docker cp /tmp/media/. <container>:/app/media/" >&2
  fi
fi

# --- conferência -----------------------------------------------------------
echo
echo "==> Conferência (TODOS os modelos, não amostra)"
CID_BACK="$(cid_backend)"
docker exec "$CID_BACK" python manage.py shell -c "
from django.apps import apps
apps_locais = ['usuario','unidade','chamado','equipeTecnica','automovel',
               'equipamento','manutencao','terceirizada','ramal','core']
total = 0
falhas = []
for nome in apps_locais:
    try: cfg = apps.get_app_config(nome)
    except LookupError: continue
    linhas = []
    for M in cfg.get_models():
        # Contar NÃO pode falhar em silêncio: foi assim que uma tabela ausente
        # passou despercebida, com o total fechando 67 registros a menos.
        try:
            n = M.objects.count()
        except Exception as erro:
            falhas.append((M._meta.label, str(erro)[:80]))
            continue
        total += n
        linhas.append((M._meta.label, n))
    for label, n in sorted(linhas, key=lambda x: -x[1]):
        print(f'  {label:42} {n:>6}')
print(f'  {\"TOTAL\":42} {total:>6}')
if falhas:
    print()
    print('  !! MODELOS QUE NAO PUDERAM SER CONTADOS:')
    for label, erro in falhas:
        print(f'     {label}: {erro}')
    print('  !! A IMPORTACAO ESTA INCOMPLETA - nao trate como concluida.')
" 2>/dev/null | grep -E '^\s{2}\S'

echo
echo "Compare com a origem. Se algo estiver errado, o estado anterior está em:"
echo "  $ANTES"
