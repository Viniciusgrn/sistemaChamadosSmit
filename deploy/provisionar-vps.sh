#!/bin/bash
# Prepara a VPS para receber o sistema, em uma máquina que JÁ HOSPEDA OUTROS
# SISTEMAS EM PRODUÇÃO.
#
#   bash deploy/verificar-vps.sh     # rode ANTES: diagnostica sem alterar nada
#   sudo bash deploy/provisionar-vps.sh
#
# Princípio deste script: só ADICIONA o que falta. Ele não atualiza pacotes
# existentes, não ativa firewall, não muda fuso do host e não reinicia serviço
# de terceiro. Tudo que poderia derrubar outro sistema virou instrução impressa
# para você decidir — não ação automática.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root (sudo bash deploy/provisionar-vps.sh)." >&2
  exit 1
fi

# --dedicada: a máquina é só deste sistema, então o firewall pode ser ativado
# sem risco de cortar serviço de terceiro. Sem a flag, o script não ativa nada.
DEDICADA=0
[ "${1:-}" = "--dedicada" ] && DEDICADA=1

avisar() { printf '\n\033[33m!! %s\033[0m\n' "$1"; }

echo "==> Índice de pacotes"
export DEBIAN_FRONTEND=noninteractive
apt-get update
# NÃO existe 'apt-get upgrade' aqui de propósito: atualizar tudo pode reiniciar
# banco, proxy ou runtime dos outros sistemas desta máquina. Atualização de
# sistema é manutenção planejada, não efeito colateral de um deploy.

echo "==> Docker Engine + plugin compose"
if command -v docker >/dev/null 2>&1; then
  echo "Docker já instalado ($(docker --version)) — mantendo como está."
  if ! docker compose version >/dev/null 2>&1; then
    avisar "Plugin 'docker compose' ausente. Instalando só o plugin."
    apt-get install -y docker-compose-plugin
  fi
else
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io \
                     docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

# ---------------------------------------------------------------------------
# Firewall: NUNCA ativado por este script.
#
# `ufw enable` com uma lista curta de portas derruba tudo que não estiver nela —
# e nesta VPS isso significa os outros sistemas. Ativar firewall exige antes
# mapear todas as portas em uso, e essa decisão é sua.
# ---------------------------------------------------------------------------
echo "==> Firewall"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | head -1 | grep -qi "^Status: active"; then
  echo "ufw já ativo. Liberando 80/443 (adicionar regra ALLOW não bloqueia nada):"
  ufw allow 80/tcp
  ufw allow 443/tcp
elif [ "$DEDICADA" -eq 1 ]; then
  # Máquina dedicada: ativar é seguro, porque não há serviço de terceiro para
  # ficar de fora. 3306 e 8003 seguem fechados de propósito — são internos ao
  # compose e ao loopback.
  #
  # A porta do SSH é DETECTADA, nunca assumida: `ufw allow OpenSSH` libera a 22,
  # e num servidor com SSH em outra porta isso tranca você para fora na hora em
  # que o firewall sobe. Em Ubuntu recente o sshd é ativado por socket, então a
  # porta pode estar no systemd e não no sshd_config — daí as três fontes.
  PORTAS_SSH=$(
    {
      ss -lntpH 2>/dev/null | awk '/sshd|ssh\.socket/ {n=split($4,a,":"); print a[n]}'
      grep -hoP '^\s*Port\s+\K[0-9]+' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null
      grep -hoP '^\s*ListenStream=.*:\K[0-9]+' /etc/systemd/system/ssh.socket.d/*.conf 2>/dev/null
    } | sort -un
  )

  if [ -z "$PORTAS_SSH" ]; then
    avisar "Não consegui descobrir a porta do SSH — NÃO vou ativar o firewall."
    echo "   Ativar às cegas pode te deixar sem acesso ao servidor."
    echo "   Descubra com 'ss -lntp | grep ssh' e libere a porta manualmente:"
    echo "       ufw allow <porta>/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable"
  else
    echo "Máquina dedicada: ativando ufw."
    apt-get install -y ufw
    for p in $PORTAS_SSH; do
      echo "   liberando SSH na porta $p"
      ufw allow "$p/tcp"
    done
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    ufw status verbose
  fi
else
  avisar "ufw inativo ou ausente — NÃO vou ativar."
  echo "   Numa máquina COMPARTILHADA, ativar agora bloquearia as portas dos"
  echo "   outros sistemas. Mapeie o que está em uso com:  ss -lntp"
  echo "   libere TODAS essas portas, e só então ative."
  echo
  echo "   Se esta máquina é dedicada a este sistema, rode com:"
  echo "       sudo bash $0 --dedicada"
fi

# ---------------------------------------------------------------------------
# Fuso: não mexo no host. A aplicação já roda em America/Sao_Paulo por conta
# própria (TZ nos containers + TIME_ZONE no settings.py). Mudar o fuso do host
# mexeria no log e no cron dos outros sistemas.
# ---------------------------------------------------------------------------
FUSO_HOST=$(timedatectl show -p Timezone --value 2>/dev/null || echo '?')
echo "==> Fuso do host: $FUSO_HOST (mantido — os containers usam America/Sao_Paulo)"

# ---------------------------------------------------------------------------
# Swap: só em máquina apertada. Com RAM sobrando é disco fazendo papel de RAM.
# ---------------------------------------------------------------------------
RAM_MB=$(free -m | awk '/^Mem:/ {print $2}')
if [ "$RAM_MB" -ge 4000 ]; then
  echo "==> Swap: ${RAM_MB}MB de RAM, dispensável — pulando."
elif swapon --show | grep -q .; then
  echo "==> Swap: já existe — pulando."
else
  echo "==> Swap: RAM baixa (${RAM_MB}MB), criando 2G"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo
echo "Pronto — nada dos outros sistemas foi alterado."
docker --version
docker compose version
echo
echo "Próximo passo: confira o que já roda na máquina com"
echo "  bash deploy/verificar-vps.sh"
echo "A stack publica só 127.0.0.1:\${HTTP_PORT} — quem expõe é o nginx do host"
echo "(deploy/nginx/host-chamados.conf)."
