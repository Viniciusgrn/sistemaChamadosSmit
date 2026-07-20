"""
Utilitários GIS em memória (sem dependência de PostGIS).

A modelagem atual usa latitude/longitude como Decimal porque MySQL não
suporta GIS direito. Pra cálculos espaciais (distância, ponto mais próximo,
está dentro de raio) usamos `geopy` — leve, sem dependência nativa.

Quando migrar pra PostgreSQL + PostGIS, dá pra trocar essas funções por
queries .annotate(distance=Distance(...)) sem alterar a API pública.
"""

from geopy.distance import geodesic


def distancia_km(ponto_a, ponto_b):
    """
    Distância em km entre dois pontos (lat, lng), usando geoide WGS-84.

    >>> distancia_km((-22.952, -46.541), (-22.962, -46.547))
    1.279...
    """
    return geodesic(ponto_a, ponto_b).km


def coords_da_unidade(unidade):
    """Devolve (lat, lng) da unidade ou None se sem coordenadas."""
    end = getattr(unidade, 'endereco', None)
    if not end or end.latitude is None or end.longitude is None:
        return None
    return (float(end.latitude), float(end.longitude))


def unidades_mais_proximas(unidades, ponto, limite=5):
    """
    Ordena lista de Unidade pela distância ao ponto (lat, lng).
    Retorna lista de tuplas (unidade, distancia_km), tamanho ≤ limite.
    Unidades sem coords são descartadas.
    """
    com_dist = []
    for u in unidades:
        coords = coords_da_unidade(u)
        if coords is None:
            continue
        com_dist.append((u, distancia_km(coords, ponto)))
    com_dist.sort(key=lambda x: x[1])
    return com_dist[:limite]


def unidades_no_raio(unidades, ponto, raio_km):
    """
    Filtra unidades dentro de um raio (em km) a partir do ponto.
    Retorna lista de (unidade, distancia_km) ordenada por distância.
    """
    com_dist = unidades_mais_proximas(unidades, ponto, limite=len(unidades))
    return [(u, d) for (u, d) in com_dist if d <= raio_km]
