#!/bin/bash
# Instala e configura o nginx do HOST numa máquina nova, no mesmo desenho que
# já roda hoje: nginx é a porta de entrada (80/443, TLS), a stack responde no
# loopback e ele faz proxy_pass.
#
#   sudo bash deploy/instalar-nginx-host.sh chamados.exemplo.sp.gov.br
#   sudo bash deploy/instalar-nginx-host.sh chamados.exemplo.sp.gov.br 8003
#
# NÃO emite certificado nem sobe a stack: imprime o comando do certbot no fim,
# porque ele só funciona depois que o DNS apontar para esta máquina.
set -euo pipefail

DOMINIO="${1:-}"
PORTA="${2:-8003}"

if [ -z "$DOMINIO" ]; then
  echo "Uso: sudo bash $0 <dominio> [porta-loopback]" >&2
  echo "Ex.: sudo bash $0 chamados.exemplo.sp.gov.br 8003" >&2
  exit 1
fi
if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root (sudo)." >&2
  exit 1
fi

cd "$(dirname "$0")/.."
MODELO="deploy/nginx/host-chamados.template.conf"
CATCHALL="deploy/nginx/catchall.conf"
[ -f "$MODELO" ] || { echo "Modelo não encontrado: $MODELO" >&2; exit 1; }

echo "==> Instalando nginx e certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Conferindo se a porta $PORTA está ocupada por outra coisa"
if ss -lntp "sport = :$PORTA" 2>/dev/null | grep -q LISTEN; then
  echo "   já há algo escutando em $PORTA (provavelmente a própria stack) — ok"
else
  echo "   nada em $PORTA ainda. Normal se a stack não subiu; o nginx vai"
  echo "   devolver 502 até 'docker compose up -d' rodar."
fi

echo "==> Site do sistema"
DESTINO="/etc/nginx/sites-available/$DOMINIO"
sed -e "s|__DOMINIO__|$DOMINIO|g" -e "s|__PORTA__|$PORTA|g" "$MODELO" > "$DESTINO"
ln -sfn "$DESTINO" "/etc/nginx/sites-enabled/$DOMINIO"
echo "   $DESTINO"

echo "==> Catch-all para domínio desconhecido"
# Substitui o 'default' do Ubuntu, que serve a página "Welcome to nginx" —
# ela expõe a existência do servidor sem necessidade nenhuma.
cp "$CATCHALL" /etc/nginx/sites-available/000-catchall
ln -sfn /etc/nginx/sites-available/000-catchall /etc/nginx/sites-enabled/000-catchall
rm -f /etc/nginx/sites-enabled/default
echo "   página 'Welcome to nginx' desativada"

echo "==> Testando a configuração"
nginx -t

systemctl enable --now nginx
systemctl reload nginx

echo
echo "nginx pronto. Estado das portas:"
ss -lntp 'sport = :80 or sport = :443' 2>/dev/null | tail -n +2 | awk '{print "   " $4 "  " $NF}'

cat <<FIM

Próximos passos, nesta ordem:

  1. Suba a stack (se ainda não subiu):
       docker compose up -d --build

  2. Teste por dentro, sem depender de DNS:
       curl -s -o /dev/null -w '%{http_code}\\n' -H 'Host: $DOMINIO' http://127.0.0.1/
     Espera-se 200. Se der 502, a stack não está no ar na porta $PORTA.

  3. Aponte o DNS de $DOMINIO para o IP desta máquina e confirme:
       dig +short $DOMINIO @8.8.8.8

  4. Só então emita o certificado:
       certbot --nginx -d $DOMINIO

  5. E ligue o HTTPS no Django:
       sed -i 's/^DJANGO_HTTPS=0/DJANGO_HTTPS=1/' .env && docker compose up -d backend

FIM
