from rest_framework import permissions, viewsets

from core.mixins import AuditMixin
from core.permissions import AprendizSomenteLeitura, SoQuemOperaOSistema
from .models import DispositivoRede, RedeWifi
from .serializers import DispositivoRedeSerializer, RedeWifiSerializer


class _BaseRedeViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    Regras comuns do mapeamento: área fechada (nem leitura fora da TI) e filtro
    por unidade, que é como a tela consome — "a rede da escola X".
    """
    permission_classes = [
        permissions.IsAuthenticated,
        SoQuemOperaOSistema,
        # aprendiz enxerga o mapeamento (está em campo junto), mas não edita
        AprendizSomenteLeitura,
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        unidade = self.request.query_params.get('unidade')
        if unidade:
            qs = qs.filter(unidade_id=unidade)
        return qs


class DispositivoRedeViewSet(_BaseRedeViewSet):
    queryset = (
        DispositivoRede.objects
        .select_related('unidade', 'equipamento')
        .all()
    )
    serializer_class = DispositivoRedeSerializer


class RedeWifiViewSet(_BaseRedeViewSet):
    queryset = (
        RedeWifi.objects
        .select_related('unidade', 'emitida_por')
        .all()
    )
    serializer_class = RedeWifiSerializer
