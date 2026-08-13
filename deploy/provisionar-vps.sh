#!/bin/bash
# Prepara uma VPS Ubuntu/Debian limpa para receber o sistema.
#
# Roda como root, uma única vez:
#   bash deploy/provisionar-vps.sh
#
# NÃO sobe a aplicação — só deixa a máquina pronta. O passo a passo do deploy
# em si está no deploy/README.md.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root (sudo bash deploy/provisionar-vps.sh)." >&2
  exit 1
fi

echo "==> Atualizando pacotes"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

echo "==> Instalando Docker Engine + plugin compose"
if ! command -v docker >/dev/null 2>&1; then
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
else
  echo "Docker já instalado — pulando."
fi

systemctl enable --now docker

echo "==> Firewall (ufw)"
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
# 3306 (MySQL) e 8000 (gunicorn) ficam de fora de propósito: são internos ao
# compose e não precisam ser alcançáveis pela internet.
ufw --force enable
ufw status verbose

echo "==> Swap"
# Só faz sentido em máquina apertada: o pico de memória aqui é o 'vite build',
# que num VPS de 2 GB morre pelo OOM killer no meio. Nesta VPS (KVM4, 16 GB)
# sobra memória de verdade — swap seria disco fazendo papel de RAM à toa.
RAM_MB=$(free -m | awk '/^Mem:/ {print $2}')
if [ "$RAM_MB" -ge 4000 ]; then
  echo "${RAM_MB}MB de RAM — swap dispensável, pulando."
elif swapon --show | grep -q .; then
  echo "Swap já existe — pulando."
else
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap de 2G criada (RAM baixa: ${RAM_MB}MB)."
fi

echo "==> Fuso horário"
timedatectl set-timezone America/Sao_Paulo

echo
echo "Pronto. Versões instaladas:"
docker --version
docker compose version
echo
echo "Próximo passo: deploy/README.md (clonar o repo, preencher o .env, subir)."
