#!/bin/bash
# Constrói as imagens, cria os secrets (na primeira vez) e faz o deploy da
# stack no Swarm. Roda na VPS, a partir da raiz do repositório:
#
#   bash deploy/swarm/publicar.sh
#
# O Swarm não constrói imagem: por isso o build acontece aqui, com nome fixo, e
# o stack.yml só referencia. Em nó único isso basta — não há registry no meio.
set -euo pipefail

cd "$(dirname "$0")/../.."   # raiz do repositório

STACK=chamados

if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
  echo "Swarm não está ativo. Inicialize uma vez com:" >&2
  echo "  docker swarm init --advertise-addr 2.24.89.242" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Secrets: criados uma única vez. Depois disso vivem no Swarm, não no disco.
# ---------------------------------------------------------------------------
criar_secret() {
  local nome="$1"
  if docker secret inspect "$nome" >/dev/null 2>&1; then
    echo "secret '$nome' já existe — mantendo."
    return
  fi
  echo "Criando secret '$nome'…"
  openssl rand -base64 "$2" | tr -d '\n' | docker secret create "$nome" -
}

criar_secret django_secret_key 48
criar_secret db_password 24
criar_secret db_root_password 24

# ---------------------------------------------------------------------------
# Imagens
# ---------------------------------------------------------------------------
echo "==> Build do backend"
docker build -t chamados-backend:latest ./backendChamados

echo "==> Build do front + nginx"
docker build -t chamados-web:latest \
  --build-arg VITE_API_URL=/api \
  ./frontendChamados

# ---------------------------------------------------------------------------
# Deploy
# ---------------------------------------------------------------------------
# --resolve-image never: sem isso o Swarm procura as imagens num registry
# remoto, não acha, e o serviço fica preso em "no suitable node".
echo "==> Deploy da stack '$STACK'"
set -a
[ -f .env ] && . ./.env    # ALLOWED_HOSTS, CSRF, DJANGO_HTTPS, DB_NAME, DB_USER
set +a

docker stack deploy \
  -c deploy/swarm/stack.yml \
  --resolve-image never \
  --prune \
  "$STACK"

echo
echo "Acompanhe a subida:"
echo "  docker stack services $STACK"
echo "  docker service logs -f ${STACK}_backend"
