"""
A Secretaria de Governo perdeu o "Inovação" também na sigla: SMGDEI -> SMGDE.
(o "I" final era justamente o de Inovação, que saiu com a criação da SMIT)
"""

from django.db import migrations


def renomeia_sigla(apps, schema_editor):
    Secretaria = apps.get_model('unidade', 'Secretaria')
    Secretaria.objects.filter(sigla='SMGDEI').update(sigla='SMGDE')


def desfaz(apps, schema_editor):
    Secretaria = apps.get_model('unidade', 'Secretaria')
    Secretaria.objects.filter(sigla='SMGDE').update(sigla='SMGDEI')


class Migration(migrations.Migration):

    dependencies = [
        ('unidade', '0018_secretaria_smit'),
    ]

    operations = [
        migrations.RunPython(renomeia_sigla, desfaz),
    ]
