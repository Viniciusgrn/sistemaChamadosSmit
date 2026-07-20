from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets, mixins
from rest_framework.exceptions import PermissionDenied, ValidationError

from core.mixins import AuditMixin
from .models import Usuario, SolicitacaoDivisao
from .serializers import UsuarioSerializer, SolicitacaoDivisaoSerializer


def payload_sessao(user):
    """Dados do usuário logado que o front precisa pra montar a UI."""
    divisao = user.divisao
    eh_dit = bool(
        user.is_superuser
        or (divisao and (divisao.sigla or '').upper() == 'DIT')
    )
    eh_secretario = user.secretarias_chefiadas.exists()
    eh_chefe = user.subordinados.exists()
    return {
        'id': user.id,
        'username': user.username,
        'nome_completo': user.nome_completo or user.username,
        'matricula': user.matricula,
        'email': user.email,
        'eh_dit': eh_dit,
        'eh_secretario': eh_secretario,
        'eh_chefe': eh_chefe,
        # chefes, secretários e DIT escolhem onde o chamado é aberto;
        # o resto abre sempre pro próprio setor
        'pode_escolher_unidade': eh_dit or eh_secretario or eh_chefe,
        'is_superuser': user.is_superuser,
        'precisa_trocar_senha': user.precisa_trocar_senha,
        'divisao': {
            'id': divisao.id,
            'nome': divisao.nome,
            'sigla': divisao.sigla,
            'secretaria': divisao.secretaria.sigla,
        } if divisao else None,
        'unidade_id': user.unidade_id,
    }


class UsuarioViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # login não exige sessão prévia nem CSRF

    def post(self, request):
        username = (request.data.get('username') or '').strip().lower()
        password = request.data.get('password') or ''

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return Response(payload_sessao(user), status=status.HTTP_200_OK)

        return Response({'detail': 'Usuário ou senha inválidos.'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'detail': 'Logout realizado com sucesso.'})


class SessaoAtualView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response(payload_sessao(request.user))
        return Response({'detail': 'Não autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)


def _eh_dit(user):
    return bool(
        user.is_superuser
        or (user.divisao and (user.divisao.sigla or '').upper() == 'DIT')
    )


def _divisoes_do_chefe(user):
    """Divisões em que o usuário manda: a própria + as de todos os subordinados."""
    if not user.subordinados.exists():
        return set()
    divisoes = set()
    if user.divisao_id:
        divisoes.add(user.divisao_id)
    ids, fronteira = set(), [user.id]
    while fronteira:
        novos = [
            i for i in Usuario.objects.filter(chefe_imediato_id__in=fronteira).values_list('id', flat=True)
            if i not in ids
        ]
        ids.update(novos)
        fronteira = novos
    divisoes.update(
        Usuario.objects.filter(id__in=ids, divisao__isnull=False).values_list('divisao_id', flat=True)
    )
    return divisoes


class SolicitacaoDivisaoViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Pedidos de vínculo a um setor.
    - usuário comum: cria (pra si) e vê os próprios pedidos
    - chefe: vê e decide os pedidos das divisões em que manda
    - DIT: vê e decide tudo
    """
    serializer_class = SolicitacaoDivisaoSerializer

    def get_queryset(self):
        qs = SolicitacaoDivisao.objects.select_related(
            'usuario', 'divisao__secretaria', 'decidido_por'
        )
        user = self.request.user
        if not _eh_dit(user):
            from django.db.models import Q
            cond = Q(usuario=user)
            divisoes = _divisoes_do_chefe(user)
            if divisoes:
                cond |= Q(divisao_id__in=divisoes)
            qs = qs.filter(cond)
        status_p = self.request.query_params.get('status')
        if status_p is not None and status_p != '':
            qs = qs.filter(status=status_p)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if SolicitacaoDivisao.objects.filter(usuario=user, status=0).exists():
            raise ValidationError({'detail': 'Você já tem uma solicitação pendente.'})
        serializer.save(usuario=user)

    def _pode_decidir(self, user, solicitacao):
        return _eh_dit(user) or solicitacao.divisao_id in _divisoes_do_chefe(user)

    def _decidir(self, request, aprovada):
        sol = self.get_object()
        if sol.status != 0:
            raise ValidationError({'detail': 'Esta solicitação já foi decidida.'})
        if not self._pode_decidir(request.user, sol):
            raise PermissionDenied('Você não pode decidir esta solicitação.')

        sol.status = 1 if aprovada else 2
        sol.decidido_por = request.user
        sol.decidido_em = timezone.now()
        sol.save()

        if aprovada:
            u = sol.usuario
            u.divisao = sol.divisao
            u.divisao_definida = True
            u.save(update_fields=['divisao', 'divisao_definida', 'updated_at'])

        return Response(SolicitacaoDivisaoSerializer(sol).data)

    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        return self._decidir(request, aprovada=True)

    @action(detail=True, methods=['post'])
    def recusar(self, request, pk=None):
        return self._decidir(request, aprovada=False)


class TrocarSenhaView(APIView):
    """POST {senha_atual, nova_senha} — troca a senha do usuário logado."""

    def post(self, request):
        user = request.user
        senha_atual = request.data.get('senha_atual') or ''
        nova_senha = request.data.get('nova_senha') or ''

        if not user.check_password(senha_atual):
            return Response({'detail': 'Senha atual incorreta.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(nova_senha) < 8:
            return Response({'detail': 'A nova senha precisa de pelo menos 8 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
        if nova_senha == senha_atual:
            return Response({'detail': 'A nova senha precisa ser diferente da atual.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(nova_senha)
        user.precisa_trocar_senha = False
        user.save(update_fields=['password', 'precisa_trocar_senha', 'updated_at'])
        # mantém a sessão logada após a troca
        update_session_auth_hash(request, user)
        return Response({'detail': 'Senha alterada com sucesso.'})
