from rest_framework import viewsets

from core.mixins import AuditMixin
from .models import Manutencao
from .serializers import ManutencaoSerializer


class ManutencaoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = (
        Manutencao.objects
        .select_related('equipamento__unidade_atual', 'chamado', 'backup_feito_por')
        .prefetch_related('tecnicos__usuario')
        .order_by('-created_at')
    )
    serializer_class = ManutencaoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        status = params.get('status')
        equipamento = params.get('equipamento')
        if status is not None and status != '':
            qs = qs.filter(status=status)
        if equipamento:
            qs = qs.filter(equipamento_id=equipamento)
        return qs
