"""
Cria o Predio do Paço Municipal e suas 2 plantas (térreo + superior),
copiando as imagens de frontendChamados/src/assets pro MEDIA_ROOT.

Reexecutável (update_or_create). Endereço do Paço = id 31 por padrão.
"""

import os
import shutil

from django.conf import settings
from django.core.management.base import BaseCommand

from unidade.models import Endereco, Predio, PlantaAndar

# (arquivo origem, andar, nome)
PLANTAS = [
    ('paco_terreo.png',   0, 'Térreo'),
    ('paco_superior.png', 1, 'Superior'),
]


class Command(BaseCommand):
    help = 'Cria o Predio do Paço + plantas (térreo/superior) a partir dos assets do front.'

    def add_arguments(self, parser):
        parser.add_argument('--endereco', type=int, default=31, help='ID do endereço do Paço (default 31).')

    def handle(self, *args, **opts):
        try:
            endereco = Endereco.objects.get(id=opts['endereco'])
        except Endereco.DoesNotExist:
            self.stderr.write(f"Endereço id={opts['endereco']} não existe.")
            return

        origem_dir = settings.BASE_DIR.parent / 'frontendChamados' / 'src' / 'assets'
        destino_dir = settings.MEDIA_ROOT / 'plantas'
        os.makedirs(destino_dir, exist_ok=True)

        predio, _ = Predio.objects.update_or_create(
            endereco=endereco,
            defaults={'nome': 'Paço Municipal'},
        )
        self.stdout.write(f'Predio: {predio.nome} (endereco {endereco.id})')

        for arquivo, andar, nome in PLANTAS:
            src = origem_dir / arquivo
            if not src.exists():
                self.stderr.write(f'  [!] não achei {src}')
                continue
            shutil.copy(src, destino_dir / arquivo)
            planta, criada = PlantaAndar.objects.update_or_create(
                predio=predio, andar=andar,
                defaults={'nome': nome, 'imagem': f'plantas/{arquivo}'},
            )
            self.stdout.write(f"  {'criada' if criada else 'atualizada'}: {nome} -> media/plantas/{arquivo}")

        self.stdout.write(self.style.SUCCESS('Concluído.'))
