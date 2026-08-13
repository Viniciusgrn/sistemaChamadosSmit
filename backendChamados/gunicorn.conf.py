"""
Configuração do Gunicorn. Ele carrega este arquivo sozinho quando roda com o
diretório de trabalho em /app — por isso o CMD do Dockerfile não passa flags.

Aqui mora a capacidade real de atender requisições simultâneas: cada worker é
um processo que atende UMA requisição por vez. Com poucos workers, a requisição
número N+1 fica na fila do socket — e o usuário vê "travamento" sem que CPU,
memória ou banco estejam sequer perto do limite.
"""
import multiprocessing
import os

bind = '0.0.0.0:8000'

# Regra do manual do Gunicorn: (2 x núcleos) + 1. Ela assume que o processo
# passa boa parte do tempo esperando I/O (banco, disco), que é o caso aqui.
#
# WEB_CONCURRENCY sobrepõe. Isso importa no Swarm: com 2 réplicas na mesma
# máquina, cada uma deve ficar com METADE dos workers, senão o total passa do
# que os núcleos aguentam e os processos brigam por CPU.
_nucleos = multiprocessing.cpu_count()
workers = int(os.environ.get('WEB_CONCURRENCY', (2 * _nucleos) + 1))

# Threads por worker: aumenta a concorrência sem multiplicar o consumo de
# memória. Django é thread-safe; o driver do MySQL abre conexão por thread.
threads = int(os.environ.get('GUNICORN_THREADS', 2))
worker_class = 'gthread'

# Requisição que passa disso está travada em algo — derruba e recicla o worker
# em vez de deixar a fila crescer atrás dela.
timeout = 60
graceful_timeout = 30

# Conexão HTTP reaproveitada entre requisições do mesmo usuário. O nginx na
# frente mantém keep-alive; sem isso cada chamada da SPA reabre socket.
keepalive = 5

# Recicla worker periodicamente: qualquer vazamento de memória lento (o nosso
# ou de dependência) não se acumula por dias. O jitter evita que todos os
# workers reiniciem no mesmo instante e criem um vale de indisponibilidade.
max_requests = 1000
max_requests_jitter = 100

accesslog = '-'
errorlog = '-'
access_log_format = '%(h)s %(t)s "%(r)s" %(s)s %(b)s %(L)ss'
