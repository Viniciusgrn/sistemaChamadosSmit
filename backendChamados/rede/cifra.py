"""
Cifra das senhas do mapeamento de rede.

Senha de equipamento é um COFRE, não uma credencial de login: precisa ser lida
de volta pelo técnico, então hash está fora de questão. O que dá pra fazer é
não deixá-la legível no banco — um dump do MySQL que vaze não pode entregar a
senha de todo switch e Wi-Fi da prefeitura.

Fernet (AES-128-CBC + HMAC) com chave própria em REDE_CHAVE_CIFRA no .env.
Sem a variável, a chave é DERIVADA da SECRET_KEY — funciona em desenvolvimento
sem configurar nada, mas em produção use a chave dedicada: se um dia a
SECRET_KEY for trocada, a derivada muda junto e as senhas ficam ilegíveis.

Gerar a chave de produção:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

# prefixo gravado junto do valor cifrado: permite reconhecer o formato e
# migrar o esquema de cifra no futuro sem adivinhação
_PREFIXO = 'fernet$'


def _chave():
    explicita = os.environ.get('REDE_CHAVE_CIFRA')
    if explicita:
        return explicita.encode()
    # dev: deriva da SECRET_KEY pra não exigir configuração
    digesto = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(digesto)


def cifrar(texto):
    if not texto:
        return ''
    token = Fernet(_chave()).encrypt(texto.encode())
    return _PREFIXO + token.decode()


def decifrar(valor):
    """
    Valor ilegível (chave trocada, dado corrompido) NÃO explode a tela: volta
    um marcador claro pra pessoa perceber e recadastrar a senha.
    """
    if not valor:
        return ''
    if not valor.startswith(_PREFIXO):
        # dado antigo/importado sem cifra: devolve como está
        return valor
    try:
        return Fernet(_chave()).decrypt(valor[len(_PREFIXO):].encode()).decode()
    except (InvalidToken, ValueError):
        return '⚠ senha ilegível — recadastre'
