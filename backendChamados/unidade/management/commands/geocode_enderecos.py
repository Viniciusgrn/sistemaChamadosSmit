"""
Geocodifica os Enderecos sem coordenadas usando Nominatim (OpenStreetMap).

Uso:
    python manage.py geocode_enderecos              # só os sem coords
    python manage.py geocode_enderecos --refazer    # todos
    python manage.py geocode_enderecos --cidade "Bragança Paulista"

Nominatim é gratuito mas exige:
  - user_agent próprio
  - máximo ~1 req/segundo (respeitado via RateLimiter)

Endereços rurais / "s/n" costumam falhar no nível da rua; nesse caso cai
pro bairro + cidade como fallback (coordenada aproximada).
"""

from decimal import Decimal
import time

from django.core.management.base import BaseCommand
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

from unidade.models import Endereco


class Command(BaseCommand):
    help = 'Preenche latitude/longitude dos endereços via Nominatim (OSM).'

    def add_arguments(self, parser):
        parser.add_argument('--refazer', action='store_true',
                            help='Regeocodifica todos, inclusive os que já têm coords.')
        parser.add_argument('--cidade', default='Bragança Paulista',
                            help='Cidade pra compor a query (default: Bragança Paulista).')
        parser.add_argument('--uf', default='SP')
        parser.add_argument('--limite', type=int, default=0,
                            help='Máximo de endereços a processar (0 = todos).')
        parser.add_argument('--centro-fallback', action='store_true',
                            help='Pros que falharem em tudo, usa o centro da cidade (aproximado).')

    def handle(self, *args, **opts):
        cidade = opts['cidade']
        uf = opts['uf']

        geolocator = Nominatim(user_agent='sistema_chamados_braganca')
        geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.1)

        qs = Endereco.objects.select_related('bairro').all()
        if not opts['refazer']:
            qs = qs.filter(latitude__isnull=True)
        if opts['limite']:
            qs = qs[:opts['limite']]

        total = qs.count()
        self.stdout.write(f'Geocodificando {total} endereços em {cidade}/{uf}…\n')

        ok = falhou = fallback = 0
        for i, end in enumerate(qs, 1):
            rua = (end.rua or '').strip()
            numero = (end.numero or '').strip()
            bairro = end.bairro.nome if end.bairro else ''

            # número "s/n" não ajuda a geocodificar
            num_q = numero if numero and numero.lower() not in ('s/n', 'sn', '') else ''

            # bairro sem prefixo comum (Jardim/Vila/Parque/Residencial) — o Nominatim
            # costuma indexar pelo núcleo do nome
            bairro_curto = bairro
            for pref in ('Jardim ', 'Vila ', 'Parque ', 'Residencial ', 'Conjunto '):
                if bairro_curto.startswith(pref):
                    bairro_curto = bairro_curto[len(pref):]
                    break

            tentativas = [
                ', '.join(filter(None, [f'{rua} {num_q}'.strip(), bairro, cidade, uf, 'Brasil'])),
                ', '.join(filter(None, [rua, bairro, cidade, uf, 'Brasil'])),
                ', '.join(filter(None, [bairro, cidade, uf, 'Brasil'])),
                ', '.join(filter(None, [bairro_curto, cidade, uf, 'Brasil'])) if bairro_curto != bairro else None,
            ]
            tentativas = [t for t in tentativas if t]

            loc = None
            usou_fallback = False
            for ix, q in enumerate(tentativas):
                try:
                    loc = geocode(q, country_codes='br')
                except Exception as e:
                    self.stderr.write(f'  [{end.id}] erro: {e}')
                    loc = None
                if loc:
                    usou_fallback = ix > 0
                    break

            if loc:
                end.latitude = Decimal(str(round(loc.latitude, 6)))
                end.longitude = Decimal(str(round(loc.longitude, 6)))
                end.geo_precisao = 'bairro' if usou_fallback else 'exato'
                end.save(update_fields=['latitude', 'longitude', 'geo_precisao'])
                ok += 1
                if usou_fallback:
                    fallback += 1
                tag = ' (fallback bairro)' if usou_fallback else ''
                self.stdout.write(f'  [{i}/{total}] OK  {rua}, {numero} -> {end.latitude}, {end.longitude}{tag}')
            elif opts['centro_fallback']:
                # centro de Bragança Paulista (aproximado) só pra não sumir do mapa
                end.latitude = Decimal('-22.951900')
                end.longitude = Decimal('-46.541900')
                end.geo_precisao = 'centro'
                end.save(update_fields=['latitude', 'longitude', 'geo_precisao'])
                fallback += 1
                ok += 1
                self.stdout.write(f'  [{i}/{total}] ~~  {rua}, {numero} -> CENTRO (aprox.)')
            else:
                falhou += 1
                self.stdout.write(self.style.WARNING(f'  [{i}/{total}] FALHOU: {rua}, {numero} ({bairro})'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Concluído: {ok} ok ({fallback} via fallback de bairro), {falhou} falharam.'
        ))
