"""
Permissões transversais.

O menu do front esconde o que cada perfil não usa, mas esconder botão não é
controle de acesso: quem souber a URL da API continua alcançando. Estas
classes fecham isso do lado do servidor.
"""
from rest_framework import permissions

from .papeis import eh_aprendiz

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
