"""
Sonda do HEALTHCHECK do container.

Critério: o Django RESPONDEU. Não é sobre o conteúdo — a rota exige sessão e
devolve 403 para quem não tem, e isso já prova que o processo está vivo, que o
WSGI carregou e que a requisição atravessou o gunicorn.

Falha só quando não há resposta: worker travado, deadlock no banco, processo
morto. É esse caso que o orquestrador precisa enxergar para substituir a
réplica — container "no ar" que não responde é o que causa fila.
"""
import sys
import urllib.error
import urllib.request

URL = 'http://127.0.0.1:8000/api/chamados/tickets/'

try:
    urllib.request.urlopen(URL, timeout=4)
except urllib.error.HTTPError:
    # 401/403/404 = a aplicação respondeu; é saúde suficiente para a sonda
    pass
except Exception as erro:               # noqa: BLE001 — qualquer falha é falha
    print(f'sem resposta: {erro}', file=sys.stderr)
    sys.exit(1)

sys.exit(0)
