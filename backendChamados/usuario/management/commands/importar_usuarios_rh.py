"""
Importa o relatório do RH (Matrícula, Nome, Login, Condição, Função Atual,
Desc Loc.Trab.) pra criar os servidores que ainda não têm conta.

O banco veio do AD, que só tem quem usa computador; o RH tem todo mundo
(professores, saúde, operacional). Por isso a maioria do CSV é gente nova.

Regras:
  - login já existe e é a MESMA pessoa (nome confere): só preenche a matrícula
    se estiver vazia. Nada mais é alterado.
  - conflitos NÃO entram e são listados pra decisão manual:
      · login já existe com OUTRA pessoa (o CSV reaproveitou o login)
      · matrícula já pertence a outro usuário
      · nome completo idêntico a alguém com outro login
  - os demais são criados com senha inicial Mudar@123 (troca obrigatória no
    primeiro acesso, igual ao import do AD)
  - setor: o "Desc Loc.Trab." casa com uma Unidade (escolas etc.) ou Divisão
    → já entra com divisão definida. Sem casamento, fica pendente e o local
    do RH vai pra obs_importacao — a pessoa pede o setor pelo perfil.

Por padrão SÓ SIMULA: roda tudo numa transação e desfaz no fim (os
constraints do banco são exercitados de verdade). Use --executar pra gravar.

    python manage.py importar_usuarios_rh --arquivo relatorio.csv
    python manage.py importar_usuarios_rh --arquivo relatorio.csv --executar
"""

import csv
import re
import unicodedata
from collections import Counter

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from unidade.models import Divisao, Unidade
from usuario.management.commands.tratar_usuarios_ad import title_pt
from usuario.models import Usuario

SENHA_INICIAL = 'Mudar@123'

# palavras que não identificam o local: "E.M. Profª. Fulana" × "FULANA PROFA EM"
VAZIAS = {
    'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'e.m', 'emr', 'emef', 'emei',
    'prof', 'profa', 'profo', 'professor', 'professora', 'escola', 'municipal',
    'ma', 'mª', 'dr', 'dra', 'pe', 'padre', 'sec', 'mun', 'secretaria',
    'divisao', 'departamento', 'setor',
}


def sem_acento(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'\s+', ' ', s).strip().lower()


def palavras(s):
    return {
        p for p in re.split(r'[^a-z0-9]+', sem_acento(s))
        if len(p) > 2 and p not in VAZIAS
    }


def mesma_pessoa(nome_a, nome_b):
    a = [p for p in sem_acento(nome_a).split() if p not in VAZIAS]
    b = [p for p in sem_acento(nome_b).split() if p not in VAZIAS]
    if not a or not b or a[0] != b[0]:
        return False
    return a[-1] == b[-1] or bool(set(a[1:]) & set(b[1:]))


class CasadorDeLocal:
    """Desc Loc.Trab. do RH → (divisao, unidade). Só aceita casamento único."""

    def __init__(self):
        self.unidades = [(palavras(u.nome), u) for u in Unidade.objects.select_related('divisao')]
        self.divisoes = {sem_acento(d.nome): d for d in Divisao.objects.all()}
        self.cache = {}

    def casar(self, local):
        if local in self.cache:
            return self.cache[local]
        res = (None, None)
        chave = sem_acento(local)
        if chave in self.divisoes:
            res = (self.divisoes[chave], None)
        else:
            alvo = palavras(local)
            pontuados = []
            for pals, u in self.unidades:
                comum = len(alvo & pals)
                # pelo menos 2 palavras em comum E cobrindo boa parte do nome
                # da unidade — "Escola X" não pode casar com "Escola Y"
                if comum >= 2 and comum >= 0.6 * len(pals):
                    pontuados.append((comum, u))
            if pontuados:
                pontuados.sort(key=lambda x: -x[0])
                melhor = pontuados[0][0]
                empatados = [u for c, u in pontuados if c == melhor]
                if len(empatados) == 1 and empatados[0].divisao_id:
                    u = empatados[0]
                    res = (u.divisao, u)
        self.cache[local] = res
        return res


class Command(BaseCommand):
    help = 'Cria os servidores do relatório do RH que ainda não têm conta (simula por padrão).'

    def add_arguments(self, parser):
        parser.add_argument('--arquivo', required=True, help='CSV do RH')
        parser.add_argument('--executar', action='store_true', help='grava de verdade (sem isso, só simula)')

    def handle(self, *args, **opts):
        try:
            with open(opts['arquivo'], encoding='utf-8-sig') as f:
                rows = list(csv.DictReader(f))
        except FileNotFoundError:
            raise CommandError(f'Arquivo não encontrado: {opts["arquivo"]}')

        esperadas = {'Matrícula', 'Nome', 'Login', 'Condição', 'Função Atual', 'Desc Loc.Trab.'}
        if not rows or not esperadas <= set(rows[0]):
            raise CommandError(f'Colunas esperadas: {sorted(esperadas)}')

        try:
            with transaction.atomic():
                relatorio = self._importar(rows)
                self._imprimir(relatorio, gravou=opts['executar'])
                if not opts['executar']:
                    raise _Simulacao()
        except _Simulacao:
            self.stdout.write(self.style.WARNING(
                '\nSIMULAÇÃO — nada foi gravado. Rode com --executar pra valer.'
            ))

    def _importar(self, rows):
        usuarios = list(Usuario.objects.all())
        por_login = {u.username.lower(): u for u in usuarios}
        por_mat = {u.matricula: u for u in usuarios if u.matricula}
        por_nome = {}
        for u in usuarios:
            por_nome.setdefault(sem_acento(u.nome_completo), []).append(u)

        casador = CasadorDeLocal()
        # um hash só pra todos: a senha inicial é a mesma e conhecida de
        # qualquer jeito, e PBKDF2 por usuário levaria ~15 min pra 2.800
        hash_inicial = make_password(SENHA_INICIAL)

        rel = {
            'criados': 0, 'com_setor': 0, 'matricula_preenchida': 0,
            'ja_ok': 0, 'conflitos': [], 'ignorados_condicao': Counter(),
            'locais_sem_setor': Counter(),
        }
        novos = []
        logins_vistos = set()

        for r in rows:
            login = r['Login'].strip().lower()
            mat = r['Matrícula'].strip() or None
            nome = title_pt(re.sub(r'\s+', ' ', r['Nome'].strip()))
            cond = r['Condição'].strip()
            local = r['Desc Loc.Trab.'].strip()
            funcao = r['Função Atual'].strip()

            if cond != 'Trabalhando':
                rel['ignorados_condicao'][cond] += 1
                continue
            if not login or login in logins_vistos:
                rel['conflitos'].append((login, nome, 'login vazio ou repetido no próprio CSV'))
                continue
            logins_vistos.add(login)

            existente = por_login.get(login)
            if existente:
                if not mesma_pessoa(nome, existente.nome_completo):
                    rel['conflitos'].append((
                        login, nome,
                        f'login já é de OUTRA pessoa: {existente.nome_completo}',
                    ))
                    continue
                if mat and not existente.matricula:
                    dono = por_mat.get(mat)
                    if dono and dono.pk != existente.pk:
                        rel['conflitos'].append((login, nome, f'matrícula {mat} já é de {dono.username}'))
                        continue
                    existente.matricula = mat
                    existente.save(update_fields=['matricula', 'updated_at'])
                    por_mat[mat] = existente
                    rel['matricula_preenchida'] += 1
                else:
                    rel['ja_ok'] += 1
                continue

            if mat and mat in por_mat:
                dono = por_mat[mat]
                rel['conflitos'].append((
                    login, nome,
                    f'matrícula {mat} já é de {dono.username} ({dono.nome_completo})',
                ))
                continue

            homonimos = por_nome.get(sem_acento(nome))
            if homonimos:
                rel['conflitos'].append((
                    login, nome,
                    'mesmo nome já cadastrado como ' + ', '.join(h.username for h in homonimos),
                ))
                continue

            divisao, unidade = casador.casar(local) if local else (None, None)
            obs = []
            if not divisao:
                obs.append(f'RH: local "{local}"' if local else 'RH: sem local de trabalho')
                rel['locais_sem_setor'][local or '(vazio)'] += 1
            if funcao:
                obs.append(f'função RH: {funcao}')

            u = Usuario(
                username=login,
                nome_completo=nome,
                matricula=mat,
                is_active=True,
                divisao=divisao,
                unidade=unidade,
                divisao_definida=bool(divisao),
                precisa_trocar_senha=True,
                obs_importacao=' || '.join(obs),
                password=hash_inicial,
            )
            novos.append(u)
            if mat:
                por_mat[mat] = u
            rel['criados'] += 1
            rel['com_setor'] += bool(divisao)

        Usuario.objects.bulk_create(novos, batch_size=500)
        return rel

    def _imprimir(self, rel, gravou):
        w = self.stdout.write
        w(self.style.SUCCESS(
            f'{"Criados" if gravou else "Seriam criados"}: {rel["criados"]} '
            f'(com setor definido: {rel["com_setor"]} | pendentes de setor: '
            f'{rel["criados"] - rel["com_setor"]})'
        ))
        w(f'Já existiam (mesma pessoa) — matrícula preenchida: {rel["matricula_preenchida"]} '
          f'| já completos: {rel["ja_ok"]}')
        if rel['ignorados_condicao']:
            w(f'Ignorados por condição: {dict(rel["ignorados_condicao"])}')
        w(f'Senha inicial dos criados: {SENHA_INICIAL} (troca obrigatória no 1º acesso)')

        if rel['conflitos']:
            w(self.style.WARNING(f'\nCONFLITOS — não entraram, decidir na mão ({len(rel["conflitos"])}):'))
            for login, nome, motivo in rel['conflitos']:
                w(f'  {login:<28} {nome:<45} {motivo}')

        if rel['locais_sem_setor']:
            w('\nLocais do RH sem unidade/divisão correspondente (top 15):')
            for local, n in rel['locais_sem_setor'].most_common(15):
                w(f'  {n:5}  {local}')


class _Simulacao(Exception):
    pass
