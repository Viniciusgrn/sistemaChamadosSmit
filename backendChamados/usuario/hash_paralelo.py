"""
Geração de hash de senha em processos paralelos.

Fica fora do módulo do comando de propósito: no Windows cada processo filho
nasce do zero e importa o módulo da função que vai rodar — se esse módulo
importasse models, quebraria antes do django.setup() do initializer.
"""


def iniciar_worker():
    import django
    django.setup()


def gerar_hash(senha):
    from django.contrib.auth.hashers import make_password
    return make_password(senha)
