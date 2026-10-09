"""
Troca a senha inicial compartilhada (Mudar@123) de quem ainda não a alterou
por uma senha individual: primeira letra do nome (maiúscula, sem acento) +
matrícula. Ex.: Adalberto Lopes, matrícula 10508 -> A10508.

Alvo: usuários com precisa_trocar_senha=True (nunca trocaram), exceto
superusuários. A troca obrigatória no primeiro acesso continua ligada — o
padrão é previsível, serve só pra tirar a senha que todo mundo conhece.

Matrícula:
  - quem já tem no banco usa a própria
  - quem não tem ganha a do relatório de referência quando o nome completo
    casa com UMA pessoa só lá (e a matrícula não é de outro usuário)
  - homônimo, matrícula já usada por outro, ou nome fora do relatório: fica
    como está (Mudar@123) e entra na lista do fim

Por padrão SÓ SIMULA (não gera hash nenhum). --executar grava. O hash é caro
(PBKDF2, ~0,35 s cada), por isso roda em paralelo nos núcleos da máquina.

    python manage.py redefinir_senhas_padrao --referencia relatorio.csv
    python manage.py redefinir_senhas_padrao --referencia relatorio.csv --executar
"""

import csv
import os
import re
import unicodedata
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from usuario.hash_paralelo import gerar_hash, iniciar_worker
from usuario.models import Usuario


def sem_acento(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'\s+', ' ', s).strip().lower()


def senha_padrao(nome, matricula):
    letra = sem_acento(nome)[:1].upper()
    return f'{letra}{matricula}'


def ler_referencia(caminho):
    # o export do RH sai em Latin-1; tenta UTF-8 antes pra aceitar os dois
    rows = []
    for codificacao in ('utf-8-sig', 'latin-1'):
        try:
            with open(caminho, encoding=codificacao) as f:
                rows = list(csv.DictReader(f))
            break
        except UnicodeDecodeError:
            continue
    if not rows:
        raise CommandError('Relatório vazio.')
    colunas = {sem_acento(c): c for c in rows[0]}
    if 'matricula' not in colunas or 'nome' not in colunas:
        raise CommandError(f'O relatório precisa das colunas Matrícula e Nome (veio: {list(rows[0])})')
    return [
        (r[colunas['matricula']].strip(), r[colunas['nome']].strip())
        for r in rows if r[colunas['matricula']].strip()
    ]


class Command(BaseCommand):
    help = 'Senha individual (letra do nome + matrícula) pra quem ainda está com a senha inicial.'

    def add_arguments(self, parser):
        parser.add_argument('--referencia', required=True, help='CSV do RH com Matrícula e Nome')
        parser.add_argument('--executar', action='store_true', help='grava de verdade (sem isso, só simula)')
        parser.add_argument('--processos', type=int, default=min(4, os.cpu_count() or 1))

    def handle(self, *args, **opts):
        try:
            ref = ler_referencia(opts['referencia'])
        except FileNotFoundError:
            raise CommandError(f'Arquivo não encontrado: {opts["referencia"]}')

        por_nome = defaultdict(list)
        for mat, nome in ref:
            por_nome[sem_acento(nome)].append(mat)

        matriculas_em_uso = set(
            Usuario.objects.exclude(matricula__isnull=True).exclude(matricula='')
            .values_list('matricula', flat=True)
        )

        alvos = list(
            Usuario.objects.filter(precisa_trocar_senha=True, is_superuser=False)
            .order_by('username')
        )

        trocas = []          # (usuario, matricula, preencher_matricula)
        sem_senha = Counter()
        exemplos_sem = defaultdict(list)
        for u in alvos:
            if u.matricula:
                trocas.append((u, u.matricula, False))
                continue
            cands = por_nome.get(sem_acento(u.nome_completo), [])
            if len(cands) == 1 and cands[0] not in matriculas_em_uso:
                trocas.append((u, cands[0], True))
                matriculas_em_uso.add(cands[0])
            elif len(cands) == 1:
                motivo = 'matrícula do relatório já é de outro usuário (conta duplicada?)'
                sem_senha[motivo] += 1
                exemplos_sem[motivo].append(f'{u.username} ({u.nome_completo}) -> {cands[0]}')
            elif len(cands) > 1:
                motivo = 'homônimo no relatório — não dá pra saber qual matrícula'
                sem_senha[motivo] += 1
                exemplos_sem[motivo].append(f'{u.username} ({u.nome_completo})')
            else:
                motivo = 'sem matrícula e nome fora do relatório'
                sem_senha[motivo] += 1
                exemplos_sem[motivo].append(f'{u.username} ({u.nome_completo})')

        preenchidas = sum(1 for _, _, p in trocas if p)
        w = self.stdout.write
        w(self.style.SUCCESS(
            f'{"Senhas trocadas" if opts["executar"] else "Senhas a trocar"}: {len(trocas)} '
            f'de {len(alvos)} com senha inicial'
        ))
        w(f'  matrícula já estava no banco: {len(trocas) - preenchidas}')
        w(f'  matrícula preenchida pelo relatório (nome casou): {preenchidas}')
        w('  exemplos do padrão:')
        for u, mat, _ in trocas[:3]:
            w(f'    {u.username:<24} {u.nome_completo:<40} -> {senha_padrao(u.nome_completo, mat)}')

        if sem_senha:
            w(self.style.WARNING(f'\nContinuam com Mudar@123 ({sum(sem_senha.values())}):'))
            for motivo, n in sem_senha.most_common():
                w(f'  {n:5}  {motivo}')
                for e in exemplos_sem[motivo][:5]:
                    w(f'           {e}')

        if not opts['executar']:
            w(self.style.WARNING('\nSIMULAÇÃO — nada foi gravado. Rode com --executar pra valer.'))
            return

        w(f'\nGerando {len(trocas)} hashes em {opts["processos"]} processos…')
        senhas = [senha_padrao(u.nome_completo, mat) for u, mat, _ in trocas]
        with ProcessPoolExecutor(max_workers=opts['processos'], initializer=iniciar_worker) as pool:
            hashes = list(pool.map(gerar_hash, senhas, chunksize=50))

        with transaction.atomic():
            for (u, mat, preencher), h in zip(trocas, hashes):
                u.password = h
                if preencher:
                    u.matricula = mat
            Usuario.objects.bulk_update(
                [u for u, _, _ in trocas], ['password', 'matricula'], batch_size=500,
            )
        w(self.style.SUCCESS('Pronto. A troca de senha no primeiro acesso continua obrigatória.'))
