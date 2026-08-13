#!/bin/bash
# Diagnóstico da VPS ANTES de instalar qualquer coisa.
#
#   bash deploy/verificar-vps.sh
#
# Este script NÃO altera nada. Só lê e relata. Existe porque esta VPS já hospeda
# outros sistemas em produção, e a pergunta que importa antes de subir a stack é
# "o que já está aqui e o que eu vou atropelar?".
set -uo pipefail

titulo() { printf '\n\033[1m== %s\033[0m\n' "$1"; }
alerta() { printf '  \033[33m! %s\033[0m\n' "$1"; }
grave()  { printf '  \033[31mX %s\033[0m\n' "$1"; }
ok()     { printf '  \033[32mv %s\033[0m\n' "$1"; }

CONFLITOS=0

titulo "Máquina"
echo "  $(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")"
echo "  CPU: $(nproc) núcleos | RAM: $(free -h | awk '/^Mem:/ {print $2}') | Disco livre: $(df -h / | awk 'NR==2 {print $4}')"
echo "  Fuso atual: $(timedatectl show -p Timezone --value 2>/dev/null || cat /etc/timezone 2>/dev/null)"

# Porta que a stack realmente pede. As 80/443 NÃO são nossas: quem manda nelas
# é o nginx do host, e é assim que tem que ser.
PORTA_STACK="${HTTP_PORT:-8003}"

titulo "Porta 80/443 — quem é o dono (esperado: nginx do host)"
if command -v ss >/dev/null 2>&1; then
  for porta in 80 443; do
    QUEM=$(ss -lntp "sport = :$porta" 2>/dev/null | awk 'NR>1 {print $NF}' | head -1)
    if [ -z "$QUEM" ]; then
      alerta "porta $porta LIVRE — nenhum nginx de host respondendo?"
      alerta "  o desenho aqui pressupõe um nginx no host terminando o TLS"
    elif echo "$QUEM" | grep -q 'nginx'; then
      ok "porta $porta com o nginx do host — correto, é ele quem expõe o sistema"
    else
      alerta "porta $porta ocupada por algo que NÃO é nginx: $QUEM"
      alerta "  confira se o proxy da máquina é outro (traefik/caddy)"
    fi
  done
else
  alerta "'ss' indisponível — verifique manualmente com: netstat -lntp"
fi

titulo "Porta $PORTA_STACK — esta sim é a que a stack precisa"
if command -v ss >/dev/null 2>&1; then
  QUEM=$(ss -lntp "sport = :$PORTA_STACK" 2>/dev/null | awk 'NR>1 {print $NF}' | head -1)
  if [ -n "$QUEM" ]; then
    grave "porta $PORTA_STACK OCUPADA por: $QUEM"
    CONFLITOS=$((CONFLITOS + 1))
  else
    ok "porta $PORTA_STACK livre"
  fi
fi

titulo "Docker"
if command -v docker >/dev/null 2>&1; then
  ok "instalado: $(docker --version)"
  if docker compose version >/dev/null 2>&1; then
    ok "plugin compose: $(docker compose version --short 2>/dev/null)"
  else
    alerta "plugin 'docker compose' ausente — o provisionamento instala"
  fi

  ESTADO_SWARM=$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null)
  if [ "$ESTADO_SWARM" = "active" ]; then
    alerta "Swarm JÁ ATIVO — não rode 'docker swarm init' de novo"
  else
    echo "  Swarm: inativo"
  fi

  titulo "Containers já rodando (NÃO serão tocados)"
  docker ps --format '  {{.Names}}  [{{.Image}}]  portas: {{.Ports}}' 2>/dev/null | head -30
  TOTAL=$(docker ps -q 2>/dev/null | wc -l)
  echo "  --- total: $TOTAL container(s) em execução"

  titulo "Projetos compose existentes"
  docker ps --format '{{.Label "com.docker.compose.project"}}' 2>/dev/null \
    | grep -v '^$' | sort -u | sed 's/^/  /' || echo "  (nenhum)"
  if docker ps --format '{{.Label "com.docker.compose.project"}}' 2>/dev/null | grep -qx 'sistema-chamados'; then
    alerta "já existe um projeto compose chamado 'sistema-chamados'"
  fi

  titulo "Volumes existentes (os seus dados de outros sistemas)"
  docker volume ls --format '  {{.Name}}' 2>/dev/null | head -20
else
  echo "  Docker NÃO instalado — o provisionamento instala."
fi

titulo "Firewall"
if command -v ufw >/dev/null 2>&1; then
  ESTADO=$(ufw status 2>/dev/null | head -1)
  echo "  $ESTADO"
  if echo "$ESTADO" | grep -qi inactive; then
    alerta "ufw INATIVO. Ativar agora bloquearia todas as portas que não"
    alerta "estiverem liberadas — inclusive as dos seus outros sistemas."
    alerta "O provisionamento NÃO ativa. Se quiser ativar, mapeie antes"
    alerta "todas as portas em uso (seção abaixo)."
  else
    ufw status numbered 2>/dev/null | sed 's/^/  /' | head -20
  fi
else
  echo "  ufw não instalado (o firewall pode estar no painel da Hostinger)"
fi

titulo "Todas as portas ouvindo (mapa dos seus outros sistemas)"
if command -v ss >/dev/null 2>&1; then
  ss -lntp 2>/dev/null | awk 'NR>1 {print "  " $4 "  " $NF}' | sort -u | head -40
fi

titulo "Veredito"
if [ "$CONFLITOS" -gt 0 ]; then
  grave "A porta $PORTA_STACK já está em uso."
  echo
  echo "  Escolha outra livre e ponha no .env:   HTTP_PORT=8004"
  echo "  Ajuste o mesmo número no proxy_pass de"
  echo "  /etc/nginx/sites-available/os.bragancapta.sp.gov.br"
else
  ok "Sem conflito: a stack pode subir em 127.0.0.1:$PORTA_STACK."
  echo
  echo "  Lembrete: 80 e 443 continuam sendo do nginx do host, que faz"
  echo "  proxy_pass pra cá. Isso é o desenho, não um problema."
fi
echo
