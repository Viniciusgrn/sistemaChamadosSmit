#!/bin/bash
# Gera o pacote de migração do banco + uploads, a partir da máquina de
# desenvolvimento (Git Bash no Windows).
#
#   bash deploy/exportar-banco.sh
#
# Sai em deploy/dump/ — pasta ignorada pelo git de propósito: o dump contém
# dados pessoais de 2000+ servidores e NUNCA deve ser versionado.
set -euo pipefail

cd "$(dirname "$0")/.."

DB_NAME="${DB_NAME:-sistema_chamados}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-root}"
DB_HOST="${DB_HOST:-127.0.0.1}"

MYSQLDUMP="${MYSQLDUMP:-/c/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe}"
if [ ! -x "$MYSQLDUMP" ]; then
  if command -v mysqldump >/dev/null 2>&1; then
    MYSQLDUMP="$(command -v mysqldump)"
  else
    echo "mysqldump não encontrado. Aponte o caminho:" >&2
    echo "  MYSQLDUMP='/c/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe' bash $0" >&2
    exit 1
  fi
fi

SAIDA="deploy/dump"
DATA="$(date +%Y%m%d-%H%M)"
mkdir -p "$SAIDA"

echo "==> Exportando '$DB_NAME' com $MYSQLDUMP"
# --single-transaction : dump consistente sem travar as tabelas (InnoDB)
# --no-tablespaces     : evita exigir o privilégio PROCESS
# --set-gtid-purged=OFF: sem isso o restore reclama de GTID em outro servidor
# O dump inclui a tabela django_migrations, então o `migrate` do entrypoint
# vira no-op depois da importação — o histórico de migração vai junto.
"$MYSQLDUMP" \
  -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --no-tablespaces \
  --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 \
  --routines --triggers --events \
  "$DB_NAME" > "$SAIDA/banco-$DATA.sql"

gzip -f "$SAIDA/banco-$DATA.sql"
echo "    $SAIDA/banco-$DATA.sql.gz"

# ---------------------------------------------------------------------------
# Uploads: as plantas dos andares são ImageField em disco, NÃO estão no dump.
# Migrar só o banco deixaria as telas de planta com imagem quebrada.
# ---------------------------------------------------------------------------
if [ -d backendChamados/media ] && [ -n "$(ls -A backendChamados/media 2>/dev/null)" ]; then
  echo "==> Empacotando uploads (backendChamados/media)"
  tar -czf "$SAIDA/media-$DATA.tar.gz" -C backendChamados media
  echo "    $SAIDA/media-$DATA.tar.gz"
else
  echo "==> Sem uploads em backendChamados/media — pulando."
fi

echo
echo "Envie para a VPS:"
echo "  scp $SAIDA/*-$DATA.* root@2.24.89.242:/root/"
echo "e lá rode: bash deploy/importar-banco.sh /root/banco-$DATA.sql.gz /root/media-$DATA.tar.gz"
