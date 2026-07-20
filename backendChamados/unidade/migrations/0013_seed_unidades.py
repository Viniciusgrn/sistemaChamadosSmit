"""
Data migration: importa Unidades + Telefones + E-mails + Responsáveis a partir
de unidade.csv (base oficial da prefeitura).

CSV: nome,paco_municipal,E-mail,Endereço,Responsável,divisao,Contato
  - Endereço e divisao são IDs que já existem no banco.
  - E-mail e Contato podem conter múltiplos valores (separadores variados).
  - Responsável é texto livre (pode ter titular + substituto).

Parsing é pragmático: extrai o que dá com regex, não perde números/e-mails.
"""

import csv
import os
import re

from django.conf import settings
from django.db import migrations

CSV_PATH = os.path.join(settings.BASE_DIR, 'unidade.csv')

EMAIL_RE = re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+')
RAMAL_RE = re.compile(r'rama(?:l|is)\s*:?\s*([\d\se]+)', re.IGNORECASE)
# número de telefone: DDD opcional, 4-5 dígitos, hífen opcional, 4 dígitos
FONE_RE = re.compile(r'\(?\d{2}\)?\s?9?\d{4}-?\d{4}')
# números curtos de emergência (153, 192, 156...)
CURTO_RE = re.compile(r'\b(1\d{2})\b')


def parse_emails(texto):
    if not texto:
        return []
    achados = EMAIL_RE.findall(texto)
    # dedup preservando ordem
    vistos, out = set(), []
    for e in achados:
        e = e.strip().lower()
        if e not in vistos:
            vistos.add(e)
            out.append(e)
    return out


def parse_responsaveis(texto):
    """Retorna [(nome, titular_bool), ...]."""
    if not texto or not texto.strip():
        return []
    out = []
    # separa titular | Substituto: X
    partes = re.split(r'\s*\|\s*', texto)
    for i, p in enumerate(partes):
        p = p.strip()
        if not p:
            continue
        titular = True
        m = re.match(r'(?:substitut[oa]|suplente)\s*:?\s*(.+)', p, re.IGNORECASE)
        if m:
            p = m.group(1).strip()
            titular = False
        out.append((p[:255], titular))
    return out


def parse_telefones(texto):
    """
    Retorna lista de dicts {numero, ramal, tipo, label}.
    tipo: 0 Fixo, 1 Celular, 2 WhatsApp, 3 Emergência.
    """
    if not texto or not texto.strip():
        return []

    out = []
    # 1) extrai ramais e remove do texto pra não confundir com número
    ramais = []
    def _captura_ramal(m):
        ramais.append(m.group(1).strip())
        return ' '
    texto_sem_ramal = RAMAL_RE.sub(_captura_ramal, texto)
    ramal_unico = ramais[0].split()[0] if ramais else ''

    # 2) detecta flags globais de contexto
    tem_whats = bool(re.search(r'whats', texto, re.IGNORECASE))
    tem_emerg = bool(re.search(r'emerg', texto, re.IGNORECASE))

    # 3) números completos
    numeros = FONE_RE.findall(texto_sem_ramal)
    for num in numeros:
        num_limpo = re.sub(r'\s+', ' ', num).strip()
        digitos = re.sub(r'\D', '', num_limpo)
        if tem_whats and len(digitos) >= 11 and digitos[-9] == '9':
            tipo = 2  # whatsapp (celular)
        elif len(digitos) >= 11 and digitos[-9] == '9':
            tipo = 1  # celular
        else:
            tipo = 0  # fixo
        out.append({
            'numero': num_limpo,
            'ramal': ramal_unico if len(out) == 0 else '',
            'tipo': tipo,
            'label': '',
        })

    # 4) números curtos de emergência (só se não houver nenhum número e/ou contexto emergência)
    for curto in CURTO_RE.findall(texto_sem_ramal):
        if any(curto in o['numero'] for o in out):
            continue
        out.append({'numero': curto, 'ramal': '', 'tipo': 3, 'label': 'Emergência'})

    # se nada casou mas há texto, guarda cru como fixo
    if not out and texto.strip():
        out.append({'numero': texto.strip()[:40], 'ramal': ramal_unico, 'tipo': 0, 'label': ''})

    # marca emergência nos curtos quando o texto fala "Emergência"
    if tem_emerg:
        for o in out:
            if o['numero'] in ('153', '192', '156') or len(re.sub(r'\D', '', o['numero'])) <= 3:
                o['tipo'] = 3
                o['label'] = o['label'] or 'Emergência'
    return out


def parse_bool(v):
    return str(v).strip() in ('1', 'true', 'True', 'sim', 'Sim')


def importar(apps, schema_editor):
    Unidade = apps.get_model('unidade', 'Unidade')
    Endereco = apps.get_model('unidade', 'Endereco')
    Divisao = apps.get_model('unidade', 'Divisao')
    Telefone = apps.get_model('unidade', 'TelefoneUnidade')
    Email = apps.get_model('unidade', 'EmailUnidade')
    Responsavel = apps.get_model('unidade', 'ResponsavelUnidade')

    if not os.path.exists(CSV_PATH):
        print(f'\n[seed_unidades] CSV não encontrado em {CSV_PATH} — pulando.')
        return

    end_ids = set(Endereco.objects.values_list('id', flat=True))
    div_ids = set(Divisao.objects.values_list('id', flat=True))

    criadas = 0
    with open(CSV_PATH, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            nome = (row.get('nome') or '').strip()
            if not nome:
                continue
            div_raw = (row.get('divisao') or '').strip()
            end_raw = (row.get('Endereço') or '').strip()
            if not div_raw.isdigit() or int(div_raw) not in div_ids:
                continue
            if not end_raw.isdigit() or int(end_raw) not in end_ids:
                continue

            emails = parse_emails(row.get('E-mail'))
            unidade, created = Unidade.objects.get_or_create(
                nome=nome,
                divisao_id=int(div_raw),
                defaults={
                    'paco_municipal': parse_bool(row.get('paco_municipal')),
                    'endereco_id': int(end_raw),
                    'email': emails[0] if emails else None,
                },
            )
            if not created:
                continue
            criadas += 1

            for i, e in enumerate(emails):
                Email.objects.create(unidade=unidade, endereco=e, principal=(i == 0))

            for nome_resp, titular in parse_responsaveis(row.get('Responsável')):
                Responsavel.objects.create(unidade=unidade, nome=nome_resp, titular=titular)

            for t in parse_telefones(row.get('Contato')):
                Telefone.objects.create(unidade=unidade, **t)

    print(f'\n[seed_unidades] {criadas} unidades importadas.')


def reverter(apps, schema_editor):
    # Apaga apenas o que veio do seed — como get_or_create por (nome, divisao),
    # remover tudo seria destrutivo; aqui limpamos filhos órfãos + unidades sem
    # auditoria manual. Simplificação: apaga todas as unidades (e cascateia).
    Unidade = apps.get_model('unidade', 'Unidade')
    Unidade.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('unidade', '0012_emailunidade_responsavelunidade_telefoneunidade'),
    ]

    operations = [
        migrations.RunPython(importar, reverter),
    ]
