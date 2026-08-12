"""
Recortes de dia/mês no fuso local, como intervalos de datetime.

Por que não usar `campo__date=hoje` ou `campo__month=n`: com USE_TZ=True e
TIME_ZONE fora do UTC, o Django traduz esses lookups para CONVERT_TZ() no
MySQL — e o CONVERT_TZ devolve NULL se as tabelas de fuso do MySQL não foram
carregadas (mysql_tzinfo_to_sql), o que zera a contagem sem dar erro.

Comparar com um intervalo de datetimes aware não passa por CONVERT_TZ: a
conversão acontece aqui no Python e o banco só compara dois valores UTC.
"""
from datetime import datetime, time, timedelta

from django.utils import timezone


def _aware(data, hora):
    return timezone.make_aware(datetime.combine(data, hora), timezone.get_current_timezone())


def intervalo_do_dia(data=None):
    """(início, fim) do dia local — fim exclusivo. Use com __gte / __lt."""
    data = data or timezone.localdate()
    inicio = _aware(data, time.min)
    return inicio, _aware(data + timedelta(days=1), time.min)


def intervalo_do_mes(data=None):
    """(início, fim) do mês local — fim exclusivo."""
    data = data or timezone.localdate()
    primeiro = data.replace(day=1)
    # dia 28 + 4 dias sempre cai no mês seguinte, qualquer que seja o mês
    proximo = (primeiro.replace(day=28) + timedelta(days=4)).replace(day=1)
    return _aware(primeiro, time.min), _aware(proximo, time.min)
