"""Seed inicial de 2 veículos (espelha o mock do front pra ter o que testar)."""

from django.db import migrations

VEICULOS = [
    # placa, marca, modelo, cor(0=Branco,1=Preto,2=Cinza), status(0=Disp,1=Manut,2=Uso), assentos
    ('GHM-7C92', 'Volkswagen', 'Saveiro', 1, 0, 5),
]


def popular(apps, schema_editor):
    Automovel = apps.get_model('automovel', 'Automovel')
    for placa, marca, modelo, cor, status, assentos in VEICULOS:
        Automovel.objects.update_or_create(
            placa=placa,
            defaults={'marca': marca, 'modelo': modelo, 'cor': cor,
                      'status': status, 'assentos': assentos},
        )


def reverter(apps, schema_editor):
    Automovel = apps.get_model('automovel', 'Automovel')
    Automovel.objects.filter(placa__in=[v[0] for v in VEICULOS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('automovel', '0003_automovel_assentos'),
    ]
    operations = [
        migrations.RunPython(popular, reverter),
    ]
