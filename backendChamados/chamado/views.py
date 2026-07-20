from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from core.mixins import AuditMixin
from unidade.models import Unidade
from usuario.models import Usuario
from .models import Chamado
from .serializers import ChamadoSerializer


def _eh_dit(user):
    return bool(
        user.is_superuser
        or (user.divisao and (user.divisao.sigla or '').upper() == 'DIT')
    )


def _subordinados_ids(user):
    """Fecho transitivo de subordinados via chefe_imediato (BFS)."""
    ids, fronteira = set(), [user.id]
    while fronteira:
        novos = [
            i for i in Usuario.objects
            .filter(chefe_imediato_id__in=fronteira)
            .values_list('id', flat=True)
            if i not in ids
        ]
        ids.update(novos)
        fronteira = novos
    return ids


class ChamadoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Chamado.objects.select_related(
        'unidade__divisao__secretaria', 'solicitante'
    ).all()
    serializer_class = ChamadoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        params = self.request.query_params

        if params.get('meus'):
            qs = qs.filter(solicitante=user)
        elif params.get('visiveis') and not _eh_dit(user):
            # escopo por papel:
            #  - secretário: tudo da(s) secretaria(s) que chefia
            #  - chefe: os próprios + divisões de todos os subordinados (recursivo)
            #  - servidor comum: os próprios + os da própria divisão
            cond = Q(solicitante=user)
            secretarias = list(user.secretarias_chefiadas.values_list('id', flat=True))
            if secretarias:
                cond |= Q(unidade__divisao__secretaria_id__in=secretarias)
            else:
                divisoes = set()
                if user.divisao_id:
                    divisoes.add(user.divisao_id)
                subs = _subordinados_ids(user)
                if subs:
                    divisoes.update(
                        Usuario.objects.filter(id__in=subs, divisao__isnull=False)
                        .values_list('divisao_id', flat=True)
                    )
                if divisoes:
                    cond |= Q(unidade__divisao_id__in=divisoes)
            qs = qs.filter(cond)

        status_p = params.get('status')
        if status_p is not None and status_p != '':
            qs = qs.filter(status_chamado=status_p)
        return qs

    def perform_create(self, serializer):
        user = self._audit_user()
        unidade = serializer.validated_data.get('unidade')
        pode_escolher = _eh_dit(user) or user.secretarias_chefiadas.exists() or user.subordinados.exists()

        if not pode_escolher:
            # servidor comum: chamado vai pro próprio setor, sem escolha
            if not user.divisao_id:
                # sem setor não abre chamado — precisa pedir vínculo no perfil
                raise ValidationError({
                    'detail': 'Você ainda não está vinculado a um setor. '
                              'Solicite a entrada no seu setor pelo seu perfil antes de abrir chamados.'
                })
            if unidade is not None and unidade.divisao_id != user.divisao_id:
                raise ValidationError({'unidade_id': 'Você só pode abrir chamados para o seu setor.'})
            if unidade is None:
                unidade = (
                    Unidade.objects.filter(id=user.unidade_id).first()
                    or Unidade.objects.filter(divisao_id=user.divisao_id).order_by('id').first()
                )
                if unidade is None:
                    raise ValidationError({'unidade_id': 'Seu setor não tem unidade cadastrada — informe a unidade.'})
        elif unidade is None:
            raise ValidationError({'unidade_id': 'Informe a unidade do chamado.'})

        extras = {
            'solicitante': user,
            'nome_solicitante': user.nome_completo or user.username,
            'unidade': unidade,
        }
        # urgência é prerrogativa da DIT
        if not _eh_dit(user):
            extras['urgencia'] = 0
            extras['status_chamado'] = 0

        serializer.save(created_by=user, updated_by=user, **extras)
