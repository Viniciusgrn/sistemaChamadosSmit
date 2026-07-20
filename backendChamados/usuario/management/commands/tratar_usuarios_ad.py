"""
Trata o export do AD (Usuarios_AD_Completo.csv) e gera:

  - usuarios_ad_tratado.csv     pessoas, campos normalizados + divisao sugerida
  - usuarios_ad_descartados.csv contas de sistema/serviço, com o motivo

NÃO grava nada no banco — só lê a tabela Divisao pra casar os grupos do AD
com a hierarquia real e sugerir o FK. A importação é um passo separado.

Regras:
  - descarta: contas de computador (login termina em $), sem Nome, nomes de
    uma palavra só (printer, vpn, teste…) e contas built-in do AD
  - matricula: coluna "Empresa" só quando o número é individual — se o mesmo
    número aparece em 2+ contas (nº do setor), fica vazio e é flagado
  - email: minúsculo, sem espaços; inválido → vazio + flag
  - nome/depto/cargo: espaços colapsados, Title Case preservando de/da/dos
  - telefone: só dígitos (4 dígitos = ramal)
  - divisao_sugerida: casa grupos "Divisao de X"/"Secretaria de Y" com a
    tabela Divisao (comparação sem acento); ambíguo → lista tudo em obs
"""

import csv
import re
import unicodedata
from collections import Counter
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from unidade.models import Divisao

CONTAS_BUILTIN = {
    'krbtgt', 'guest', 'convidado', 'administrador', 'administrator',
    'conv', 'super', 'defaultaccount',
}

PARTICULAS = {'de', 'da', 'do', 'das', 'dos', 'e'}


def sem_acento(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower().strip()


def title_pt(s):
    """Title Case preservando partículas (de/da/dos…) em minúsculo."""
    palavras = s.split()
    out = []
    for i, p in enumerate(palavras):
        low = p.lower()
        if i > 0 and low in PARTICULAS:
            out.append(low)
        else:
            out.append(low.capitalize())
    return ' '.join(out)


def limpa(s):
    return re.sub(r'\s+', ' ', (s or '').strip())


EMAIL_RE = re.compile(r'^[\w.+-]+@[\w-]+\.[\w.-]+$')


class Command(BaseCommand):
    help = 'Trata o CSV do AD e gera usuarios_ad_tratado.csv + descartados.'

    def add_arguments(self, parser):
        parser.add_argument('--arquivo', default=None, help='CSV de entrada (default: BASE_DIR/Usuarios_AD_Completo.csv)')

    def handle(self, *args, **opts):
        entrada = Path(opts['arquivo']) if opts['arquivo'] else settings.BASE_DIR / 'Usuarios_AD_Completo.csv'
        if not entrada.exists():
            self.stderr.write(f'Arquivo nao encontrado: {entrada}')
            return

        with entrada.open(encoding='utf-8-sig') as f:
            rows = list(csv.DictReader(f))

        # ---- mapeamento explícito grupo AD -> id do banco (arquivo revisável) ----
        # mapeamento_grupos_ad.csv: grupo_ad,tipo,qtd_usuarios,id_banco,...
        arq_mapa = settings.BASE_DIR / 'mapeamento_grupos_ad.csv'
        mapa_div, mapa_sec = {}, {}
        if arq_mapa.exists():
            with arq_mapa.open(encoding='utf-8-sig') as f:
                for m in csv.DictReader(f):
                    grupo = sem_acento(m['grupo_ad'])
                    id_banco = (m['id_banco'] or '').strip()
                    if not id_banco:
                        continue
                    if m['tipo'] == 'divisao':
                        mapa_div[grupo] = int(id_banco)
                    elif m['tipo'] == 'secretaria':
                        mapa_sec[grupo] = int(id_banco)
        else:
            self.stderr.write('AVISO: mapeamento_grupos_ad.csv nao encontrado — divisoes ficarao sem match.')

        divisoes = {d.id: d for d in Divisao.objects.select_related('secretaria')}

        def casa_divisao(nome_grupo):
            div_id = mapa_div.get(sem_acento(nome_grupo))
            return divisoes.get(div_id) if div_id else None

        # ---- matrícula: só individual ----
        matriculas = Counter()
        for r in rows:
            m = re.sub(r'\D', '', r.get('Empresa') or '')
            if m:
                matriculas[m] += 1

        tratados, descartados = [], []
        flags_count = Counter()

        for r in rows:
            login = limpa(r['Login'])
            nome = limpa(r['Nome'])

            # ---- descarte de contas não-humanas ----
            motivo = None
            if login.endswith('$'):
                motivo = 'conta de computador'
            elif login.lower() in CONTAS_BUILTIN:
                motivo = 'conta built-in do AD'
            elif not nome:
                motivo = 'sem nome'
            elif ' ' not in nome:
                motivo = 'nome de uma palavra (conta de serviço)'
            if motivo:
                descartados.append({'Login': login, 'Nome': nome, 'Motivo': motivo, 'Ativo': r['Ativo']})
                continue

            flags = []

            # ---- email ----
            email = limpa(r['Email']).replace(' ', '').lower()
            if email and not EMAIL_RE.match(email):
                flags.append(f'email invalido: {email}')
                email = ''

            # ---- matrícula (Empresa) ----
            mat = re.sub(r'\D', '', r.get('Empresa') or '')
            if mat and matriculas[mat] > 1:
                flags.append(f'matricula {mat} compartilhada por {matriculas[mat]} contas')
                mat = ''

            # ---- telefone ----
            tel = re.sub(r'\D', '', r.get('Telefone') or '')
            cel = re.sub(r'\D', '', r.get('Celular') or '')

            # ---- último logon ----
            ult = ''
            if limpa(r.get('UltimoLogon')):
                try:
                    ult = datetime.strptime(limpa(r['UltimoLogon']), '%d/%m/%Y %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')
                except ValueError:
                    flags.append(f"ultimo logon ilegivel: {r['UltimoLogon']}")

            # ---- grupos -> divisões/secretarias/ACLs ----
            grupos = [g.strip() for g in (r.get('Grupos') or '').split(';') if g.strip()]
            grupos_div = [g for g in grupos if sem_acento(g).startswith('divisao')]
            grupos_sec = [g for g in grupos if sem_acento(g).startswith('secretaria')]
            acls = [g for g in grupos if g.upper().startswith('ACL_')]

            casadas = []
            for g in grupos_div:
                d = casa_divisao(g)
                if d and d not in casadas:
                    casadas.append(d)

            divisao_id, divisao_nome = '', ''
            if len(casadas) == 1:
                divisao_id = casadas[0].id
                divisao_nome = f'{casadas[0].secretaria.sigla} · {casadas[0].nome}'
            elif len(casadas) > 1:
                flags.append('multiplas divisoes: ' + ' | '.join(f'{d.id}:{d.nome}' for d in casadas))
            elif grupos_div:
                flags.append('grupos de divisao sem match: ' + ' | '.join(grupos_div))

            # fallback: sem divisão, mas grupos de secretaria apontam pra 1 só
            secretaria_id = ''
            secs = {mapa_sec[sem_acento(g)] for g in grupos_sec if sem_acento(g) in mapa_sec}
            if not divisao_id and len(secs) == 1:
                secretaria_id = secs.pop()
            elif not divisao_id and len(secs) > 1:
                flags.append('multiplas secretarias: ' + ' | '.join(grupos_sec))

            for fl in flags:
                flags_count[fl.split(':')[0]] += 1

            tratados.append({
                'login': login.lower(),
                'nome_completo': title_pt(nome),
                'email': email,
                'matricula': mat,
                'departamento_ad': title_pt(limpa(r.get('Departamento'))),
                'cargo_ad': title_pt(limpa(r.get('Cargo'))),
                'telefone': tel,
                'celular': cel,
                'ativo': r['Ativo'],
                'ultimo_logon': ult,
                'divisao_id': divisao_id,
                'divisao_sugerida': divisao_nome,
                'secretaria_id_fallback': secretaria_id,
                'grupos_secretaria': '; '.join(grupos_sec),
                'acls': '; '.join(acls),
                'obs': ' || '.join(flags),
            })

        # ---- saída ----
        out_ok = settings.BASE_DIR / 'usuarios_ad_tratado.csv'
        out_desc = settings.BASE_DIR / 'usuarios_ad_descartados.csv'

        with out_ok.open('w', newline='', encoding='utf-8-sig') as f:
            w = csv.DictWriter(f, fieldnames=list(tratados[0].keys()))
            w.writeheader()
            w.writerows(tratados)

        with out_desc.open('w', newline='', encoding='utf-8-sig') as f:
            w = csv.DictWriter(f, fieldnames=['Login', 'Nome', 'Motivo', 'Ativo'])
            w.writeheader()
            w.writerows(descartados)

        com_divisao = sum(1 for t in tratados if t['divisao_id'])
        com_mat = sum(1 for t in tratados if t['matricula'])
        ativos = sum(1 for t in tratados if t['ativo'] == 'True')
        self.stdout.write(self.style.SUCCESS(
            f'Tratados: {len(tratados)} pessoas ({ativos} ativas) -> {out_ok.name}\n'
            f'Descartados: {len(descartados)} -> {out_desc.name}\n'
            f'Com matricula individual: {com_mat}\n'
            f'Com divisao casada (1:1): {com_divisao}'
        ))
        if flags_count:
            self.stdout.write('\nFlags mais comuns:')
            for k, v in flags_count.most_common(10):
                self.stdout.write(f'  {v:4}  {k}')
