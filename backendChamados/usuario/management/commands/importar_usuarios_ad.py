"""
Importa o usuarios_ad_tratado.csv pro model Usuario.

Regras:
  - username = login do AD
  - senha inicial de TODOS os criados: Mudar@123 (trocar no primeiro uso)
  - divisao: só quando o tratamento resolveu exatamente 1 (divisao_id) →
    divisao_definida=True; caso contrário fica sem divisão e
    divisao_definida=False (resolver no admin em "Pendências de divisão")
  - candidatas/fallback/depto/cargo do AD vão pra obs_importacao
  - is_active espelha o Ativo do AD
  - reexecutável: atualiza pelo username; NUNCA reseta senha de quem já existe
    e não mexe em superusuários
"""

import csv

from django.conf import settings
from django.core.management.base import BaseCommand

from unidade.models import Secretaria
from usuario.models import Usuario

SENHA_INICIAL = 'Mudar@123'


class Command(BaseCommand):
    help = 'Importa usuarios_ad_tratado.csv pro model Usuario.'

    def add_arguments(self, parser):
        parser.add_argument('--arquivo', default=None, help='CSV tratado (default: BASE_DIR/usuarios_ad_tratado.csv)')

    def handle(self, *args, **opts):
        caminho = settings.BASE_DIR / 'usuarios_ad_tratado.csv' if not opts['arquivo'] else opts['arquivo']
        with open(caminho, encoding='utf-8-sig') as f:
            rows = list(csv.DictReader(f))

        secretarias = {str(s.id): s.sigla for s in Secretaria.objects.all()}

        criados = atualizados = pulados = 0
        for r in rows:
            username = r['login']

            # contexto pra resolução manual
            obs_partes = []
            if r['obs']:
                obs_partes.append(r['obs'])
            if r['secretaria_id_fallback']:
                sigla = secretarias.get(r['secretaria_id_fallback'], r['secretaria_id_fallback'])
                obs_partes.append(f'AD indica secretaria {sigla} (id {r["secretaria_id_fallback"]}), sem divisao')
            if r['departamento_ad']:
                obs_partes.append(f'depto AD: {r["departamento_ad"]}')
            if r['cargo_ad']:
                obs_partes.append(f'cargo AD: {r["cargo_ad"]}')

            dados = {
                'nome_completo': r['nome_completo'],
                'email': r['email'],
                'matricula': r['matricula'] or None,
                'is_active': r['ativo'] == 'True',
                'divisao_id': int(r['divisao_id']) if r['divisao_id'] else None,
                'divisao_definida': bool(r['divisao_id']),
                'obs_importacao': ' || '.join(obs_partes),
            }

            existente = Usuario.objects.filter(username=username).first()
            if existente:
                if existente.is_superuser:
                    pulados += 1
                    continue
                for k, v in dados.items():
                    setattr(existente, k, v)
                existente.save()
                atualizados += 1
            else:
                u = Usuario(username=username, **dados)
                u.set_password(SENHA_INICIAL)
                u.precisa_trocar_senha = True
                u.save()
                criados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Criados: {criados} | Atualizados: {atualizados} | Pulados (superuser): {pulados}\n'
            f'Senha inicial dos criados: {SENHA_INICIAL}\n'
            f'Pendencias de divisao: {Usuario.objects.filter(divisao_definida=False, is_superuser=False).count()}'
        ))
