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
echo "==> Conferência"
CID_BACK="$(cid_backend)"
docker exec "$CID_BACK" python manage.py shell -c "
from django.apps import apps
for m in ['usuario.Usuario','unidade.Unidade','chamado.Chamado','equipeTecnica.Equipe']:
    a,n = m.split('.')
    print(f'  {m}: {apps.get_model(a,n).objects.count()}')
" 2>/dev/null | tail -5

echo
echo "Compare com a origem. Se algo estiver errado, o estado anterior está em:"
echo "  $ANTES"
