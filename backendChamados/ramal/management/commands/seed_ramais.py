"""
Importa os ramais do PABX a partir de ramais.txt (na raiz do repositório).
Formato por linha:  SETOR, NUMERO ,OCUPANTE

Idempotente: limpa a tabela e recria a partir do arquivo (a base não tem
chave estável — há ramais repetidos e VAGO). Use --arquivo pra apontar outro.
"""

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from ramal.models import Ramal


class Command(BaseCommand):
    help = 'Importa os ramais do PABX a partir de ramais.txt.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--arquivo', type=str, default=None,
            help='Caminho do .txt (default: <raiz>/ramais.txt).',
        )

    def handle(self, *args, **opts):
        caminho = Path(opts['arquivo']) if opts['arquivo'] else settings.BASE_DIR.parent / 'ramais.txt'
        if not caminho.exists():
            self.stderr.write(f'Arquivo não encontrado: {caminho}')
            return

        novos = []
        ignoradas = 0
        with caminho.open(encoding='utf-8') as f:
            for n, linha in enumerate(f, 1):
                linha = linha.strip()
                if not linha:
                    continue
                partes = linha.split(',')
                if len(partes) < 2:
                    ignoradas += 1
                    self.stderr.write(f'  linha {n} ignorada (sem vírgula): {linha!r}')
                    continue
                setor = partes[0].strip()
                numero = partes[1].strip()
                ocupante = partes[2].strip() if len(partes) >= 3 else ''
                if not numero:
                    ignoradas += 1
                    continue
                novos.append(Ramal(numero=numero, setor=setor, ocupante=ocupante))

        antigos = Ramal.objects.count()
        Ramal.objects.all().delete()
        Ramal.objects.bulk_create(novos)

        self.stdout.write(self.style.SUCCESS(
            f'Ramais importados: {len(novos)} (removidos {antigos} antigos'
            f'{f", {ignoradas} linhas ignoradas" if ignoradas else ""}).'
        ))
