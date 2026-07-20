"""
Data migration: popular Secretaria com a lista oficial da prefeitura
(fonte: Secretarias.csv).

Siglas vazias no CSV foram preenchidas a partir das iniciais relevantes do
nome (Administração → SMA, Cultura e Turismo → SMCT, etc).
Cores são paleta inicial — ajustáveis no admin/back depois.
"""

from django.db import migrations


# (nome, sigla, cor)
SECRETARIAS = [
    ('Secretaria Municipal de Saúde',                                    'SMSA',   '#dc2626'),
    ('Secretaria Municipal de Serviços',                                 'SMS',    '#64748b'),
    ('Secretaria Municipal de Obras',                                    'SMO',    '#0891b2'),
    ('Secretaria Municipal de Comunicação Social',                       'SECOM',  '#2563eb'),
    ('Secretaria Municipal de Assuntos Jurídicos',                       'SMAJ',   '#4f46e5'),
    ('Secretaria Municipal de Ação e Desenvolvimento Social',            'SEMADS', '#db2777'),
    ('Secretaria Municipal de Governo, Desenvolvimento Econômico e Inovação', 'SMGDEI', '#7c3aed'),
    ('Secretaria Municipal de Juventude, Esportes e Lazer',              'SEMJEL', '#ca8a04'),
    ('Secretaria Municipal de Meio Ambiente',                            'SMMA',   '#16a34a'),
    ('Secretaria Municipal de Mobilidade Urbana',                        'SMMU',   '#ea580c'),
    ('Secretaria Municipal de Educação',                                 'SME',    '#1d4ed8'),
    ('Secretaria Municipal de Administração',                            'SMA',    '#8b5cf6'),
    ('Secretaria Municipal de Cultura e Turismo',                        'SMCT',   '#f59e0b'),
    ('Secretaria Municipal de Desenvolvimento dos Agronegócios',         'SMDA',   '#65a30d'),
    ('Secretaria Municipal de Finanças',                                 'SMF',    '#059669'),
    ('Secretaria Municipal de Habitação',                                'SMH',    '#92400e'),
    ('Secretaria Municipal de Planejamento',                             'SMP',    '#475569'),
    ('Secretaria Municipal de Segurança e Defesa Civil',                 'SMSDC',  '#991b1b'),
]


def popular(apps, schema_editor):
    Secretaria = apps.get_model('unidade', 'Secretaria')
    for nome, sigla, cor in SECRETARIAS:
        Secretaria.objects.update_or_create(
            sigla=sigla,
            defaults={'nome': nome, 'cor': cor},
        )


def reverter(apps, schema_editor):
    Secretaria = apps.get_model('unidade', 'Secretaria')
    siglas = [s[1] for s in SECRETARIAS]
    Secretaria.objects.filter(sigla__in=siglas).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('unidade', '0004_alter_secretaria_cor_alter_secretaria_sigla'),
    ]

    operations = [
        migrations.RunPython(popular, reverter),
    ]
