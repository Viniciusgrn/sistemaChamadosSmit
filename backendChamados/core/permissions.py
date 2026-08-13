"""
Permissões transversais.

O menu do front esconde o que cada perfil não usa, mas esconder botão não é
controle de acesso: quem souber a URL da API continua alcançando. Estas
classes fecham isso do lado do servidor.
"""
from rest_framework import permissions

from .papeis import coordena, eh_aprendiz

METODOS_LEITURA = permissions.SAFE_METHODS


class AprendizSomenteLeitura(permissions.BasePermission):
    """
    Estagiário e jovem aprendiz enxergam o sistema, mas não alteram cadastro.

    O que eles PODEM fazer (entrar/sair de equipe) mora em actions próprias do
    app de equipes, que têm regra própria — por isso a exceção explícita.
    """
    message = 'Seu perfil tem acesso somente de leitura nesta área.'

    # actions em que o cargo supervisionado age, e não só observa
    ACOES_LIBERADAS = {'entrar', 'sair'}

    def has_permission(self, request, view):
        if request.method in METODOS_LEITURA:
            return True
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        if not eh_aprendiz(user):
            return True
        return getattr(view, 'action', None) in self.ACOES_LIBERADAS


class CadastroDeTecnicoSoCoordenacao(permissions.BasePermission):
    """
    Só a coordenação mexe no cadastro de técnico.

    Não é questão de organização de tela: entre os campos editáveis está a
    responsabilidade "Despachante" (Tecnico.RESPONSABILIDADE_CHOICES = 3), e
    quem a possui passa em `coordena()` — o que muda o perfil operacional para
    gestão. Um técnico com acesso de escrita aqui se promoveria sozinho.

    Ler continua liberado: a lista de técnicos é usada para montar equipe.
    """
    message = 'Só o despachante ou a chefia altera o cadastro de técnicos.'

    def has_permission(self, request, view):
        if request.method in METODOS_LEITURA:
            return True
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return coordena(user)
