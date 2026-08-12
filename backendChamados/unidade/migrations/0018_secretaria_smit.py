"""
A DIT deixou de ser divisão da Secretaria de Governo e virou secretaria
própria: Secretaria Municipal de Inovação e Tecnologia (SMIT).

A divisão existente é apenas REALOCADA (não recriada), então os 40 usuários
lotados nela, a unidade e a sala do Paço continuam vinculados sem nenhum
ajuste. A SMGDEI perde o "Inovação" do nome.
"""

from django.db import migrations

NOME_SMIT = 'Secretaria Municipal de Inovação e Tecnologia'
SIGLA_SMIT = 'SMIT'
COR_SMIT = '#4f46e5'

NOME_SMGDEI_NOVO = 'Secretaria Municipal de Governo e Desenvolvimento Econômico'
NOME_SMGDEI_ANTIGO = 'Secretaria Municipal de Governo, Desenvolvimento Econômico e Inovação'


def cria_smit(apps, schema_editor):
    Secretaria = apps.get_model('unidade', 'Secretaria')
    Divisao = apps.get_model('unidade', 'Divisao')

    smit, _ = Secretaria.objects.get_or_create(
        sigla=SIGLA_SMIT,
        defaults={'nome': NOME_SMIT, 'cor': COR_SMIT},
    )

    # realoca a divisão de TI (mantém id, e com ele todos os vínculos)
    Divisao.objects.filter(sigla='DIT').update(secretaria=smit)

    # a Secretaria de Governo não cuida mais de Inovação
    Secretaria.objects.filter(sigla='SMGDEI').update(nome=NOME_SMGDEI_NOVO)


def desfaz(apps, schema_editor):
    Secretaria = apps.get_model('unidade', 'Secretaria')
    Divisao = apps.get_model('unidade', 'Divisao')

    smgdei = Secretaria.objects.filter(sigla='SMGDEI').first()
    if smgdei:
        Divisao.objects.filter(sigla='DIT').update(secretaria=smgdei)
        Secretaria.objects.filter(sigla='SMGDEI').update(nome=NOME_SMGDEI_ANTIGO)
    Secretaria.objects.filter(sigla=SIGLA_SMIT).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('unidade', '0017_remove_sala_altura_remove_sala_largura_and_more'),
    ]

    operations = [
        migrations.RunPython(cria_smit, desfaz),
    ]
