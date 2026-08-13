#!/bin/bash
# Remove os chamados e as equipes de teste, deixando o sistema pronto para o
# uso real. Roda NA VPS, a partir da raiz do repositório:
#
#   bash deploy/limpar-dados-de-teste.sh            # só mostra o que faria
#   bash deploy/limpar-dados-de-teste.sh --executar # apaga de verdade
#
# APAGA:  Chamado, Atendimento, ParticipacaoEquipe, Equipe,
#         Manutencao, ChamadoTerceirizada
# MANTÉM: técnicos e suas responsabilidades, usuários, unidades, ramais,
#         automóveis, equipamentos, empresas terceirizadas
#
# A ordem não é livre: todas as FKs são PROTECT (não CASCATA), então apagar
# Chamado antes de Atendimento levanta ProtectedError e não apaga nada.
set -euo pipefail

cd "$(dirname "$0")/.."

EXECUTAR=0
[ "${1:-}" = "--executar" ] && EXECUTAR=1

[ -f .env ] && { set -a; . ./.env; set +a; }
DB_NAME="${DB_NAME:-sistema_chamados}"

CID_DB="$(docker compose ps -q db)"
CID_BACK="$(docker compose ps -q backend)"
if [ -z "$CID_BACK" ] || [ -z "$CID_DB" ]; then
  echo "Stack não está no ar." >&2
  exit 1
fi

echo "=== ANTES ==="
docker exec -i "$CID_BACK" python manage.py shell -c "
from django.apps import apps
for r in ['chamado.Chamado','equipeTecnica.Atendimento','equipeTecnica.ParticipacaoEquipe',
          'equipeTecnica.Equipe','manutencao.Manutencao','terceirizada.ChamadoTerceirizada',
          'equipeTecnica.Tecnico','equipeTecnica.ResponsabilidadeTecnico']:
    a,n = r.split('.')
    print(f'  {r:42} {apps.get_model(a,n).objects.count():>5}')
" 2>/dev/null | grep -E '^\s{2}\S'

if [ "$EXECUTAR" -ne 1 ]; then
  echo
  echo "Modo simulação. Nada foi apagado."
  echo "Para apagar de verdade:  bash $0 --executar"
  exit 0
fi

echo
echo "Isto APAGA os chamados e as equipes acima, em PRODUÇÃO."
echo "Técnicos, usuários, unidades e ramais NÃO são tocados."
printf 'Digite LIMPAR para confirmar: '
read -r resposta
[ "$resposta" = "LIMPAR" ] || { echo "Cancelado."; exit 1; }

mkdir -p deploy/dump
ANTES="deploy/dump/antes-da-limpeza-$(date +%Y%m%d-%H%M).sql.gz"
echo "==> Backup em $ANTES"
docker exec "$CID_DB" mysqldump -u root -p"$DB_ROOT_PASSWORD" \
  --single-transaction --no-tablespaces --set-gtid-purged=OFF \
  "$DB_NAME" 2>/dev/null | gzip > "$ANTES"

echo "==> Apagando"
docker exec -i "$CID_BACK" python manage.py shell -c "
from django.db import transaction
from chamado.models import Chamado
from equipeTecnica.models import Equipe, Atendimento, ParticipacaoEquipe
from manutencao.models import Manutencao
from terceirizada.models import ChamadoTerceirizada

with transaction.atomic():
    # 1. solta o ponteiro da equipe para o chamado (PROTECT)
    Equipe.objects.update(chamado_atual=None)
    # 2. o que aponta para Chamado E para Equipe
    print('  Atendimento          ', Atendimento.objects.all().delete()[0])
    print('  Manutencao           ', Manutencao.objects.all().delete()[0])
    print('  ChamadoTerceirizada  ', ChamadoTerceirizada.objects.all().delete()[0])
    # 3. agora o chamado sai (leva junto o m2m com equipamentos)
    print('  Chamado              ', Chamado.objects.all().delete()[0])
    # 4. participacoes e equipes
    print('  ParticipacaoEquipe   ', ParticipacaoEquipe.objects.all().delete()[0])
    print('  Equipe               ', Equipe.objects.all().delete()[0])
" 2>/dev/null | grep -E '^\s{2}\S'

# Numeração recomeça do 1: o primeiro chamado real vira #1, não #142.
echo "==> Reiniciando a numeração dos chamados"
docker exec -i "$CID_DB" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME" 2>/dev/null <<SQL
ALTER TABLE chamado_chamado AUTO_INCREMENT = 1;
ALTER TABLE \`equipeTecnica_equipe\` AUTO_INCREMENT = 1;
SQL

echo
echo "=== DEPOIS ==="
docker exec -i "$CID_BACK" python manage.py shell -c "
from django.apps import apps
for r in ['chamado.Chamado','equipeTecnica.Atendimento','equipeTecnica.ParticipacaoEquipe',
          'equipeTecnica.Equipe','equipeTecnica.Tecnico','equipeTecnica.ResponsabilidadeTecnico',
          'usuario.Usuario','unidade.Unidade','ramal.Ramal']:
    a,n = r.split('.')
    print(f'  {r:42} {apps.get_model(a,n).objects.count():>5}')
" 2>/dev/null | grep -E '^\s{2}\S'

echo
echo "Se algo saiu errado, o estado anterior está em $ANTES"
