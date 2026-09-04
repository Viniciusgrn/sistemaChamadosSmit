"""
Permissões transversais.

O menu do front esconde o que cada perfil não usa, mas esconder botão não é
controle de acesso: quem souber a URL da API continua alcançando. Estas
classes fecham isso do lado do servidor.
"""
from rest_framework import permissions

from .papeis import coordena, eh_aprendiz, opera_sistema

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


class EscritaSoCoordenacao(permissions.BasePermission):
    """
    Cadastro que o técnico consulta mas não mantém.

    Leitura fica liberada — o técnico precisa da lista no dia a dia (achar um
    ramal, ver qual empresa atende o quê). Criar, alterar e apagar é da
    coordenação: administrativo, chefe de divisão, secretário ou superusuário.

    Use como classe-base e troque a `message` pelo cadastro em questão.
    """
    message = 'Só o administrativo ou a chefia altera este cadastro.'

    def has_permission(self, request, view):
        if request.method in METODOS_LEITURA:
            return True
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return coordena(user)


class CadastroDeTecnicoSoCoordenacao(EscritaSoCoordenacao):
    """
    Aqui o motivo vai além de organização: entre os campos editáveis está a
    responsabilidade "Administrativo" (Tecnico.RESPONSABILIDADE_CHOICES = 3), e
    quem a possui passa em `coordena()` — o que muda o perfil operacional para
    gestão. Um técnico com escrita aqui se promoveria sozinho.
    """
    message = 'Só o administrativo ou a chefia altera o cadastro de técnicos.'


class CadastroDeTerceirizadaSoCoordenacao(EscritaSoCoordenacao):
    """Empresas contratadas — quem contrata não é quem atende o chamado."""
    message = 'Só o administrativo ou a chefia cadastra empresas terceirizadas.'


class CadastroDeRamalSoCoordenacao(EscritaSoCoordenacao):
    """Lista telefônica da prefeitura: o técnico consulta, não mantém."""
    message = 'Só o administrativo ou a chefia altera os ramais.'


class SoQuemOperaOSistema(permissions.BasePermission):
    """
    Área fechada da operação: nem LEITURA para solicitante, chefe ou secretário.

    Nasceu pro mapeamento de rede, que guarda IP e senha de todo equipamento —
    informação que não tem por que circular fora da TI. Difere das outras
    classes daqui, que liberam leitura geral e fecham só a escrita.
    """
    message = 'Área restrita à equipe de TI.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return opera_sistema(user)
