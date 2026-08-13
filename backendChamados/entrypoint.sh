#!/bin/sh
# Prepara o container antes de entregar o processo pro Gunicorn.
#
# Roda a cada start (não só no build): migração e collectstatic precisam do
# banco e do volume, que só existem em runtime.
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"

echo "Aguardando MySQL em ${DB_HOST}:${DB_PORT}…"
tentativas=0
until nc -z "$DB_HOST" "$DB_PORT"; do
  tentativas=$((tentativas + 1))
  if [ "$tentativas" -ge 60 ]; then
    echo "MySQL não respondeu em 60s — abortando." >&2
    exit 1
  fi
  sleep 1
done
echo "MySQL respondeu."

python manage.py migrate --noinput

# --clear evita acumular arquivos de versões antigas no volume
python manage.py collectstatic --noinput --clear

exec "$@"
