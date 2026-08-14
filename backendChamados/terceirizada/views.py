from rest_framework import permissions, viewsets
from core.mixins import AuditMixin
from core.permissions import AprendizSomenteLeitura, CadastroDeTerceirizadaSoCoordenacao
from .models import EmpresaTerceirizada, ChamadoTerceirizada
from .serializers import EmpresaTerceirizadaSerializer, ChamadoTerceirizadaSerializer


class EmpresaTerceirizadaViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = (
        EmpresaTerceirizada.objects
        .prefetch_related('chamados__chamado')
        .order_by('nome')
    )
    serializer_class = EmpresaTerceirizadaSerializer
    # declarar aqui SUBSTITUI o DEFAULT_PERMISSION_CLASSES: as padrão precisam
    # ser repetidas, senão a rota fica mais aberta do que antes
    permission_classes = [
        permissions.IsAuthenticated,
        AprendizSomenteLeitura,
        CadastroDeTerceirizadaSoCoordenacao,
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        resp = self.request.query_params.get('responsabilidade')
        if resp is not None and resp != '':
            qs = qs.filter(responsabilidade=resp)
        return qs


class ChamadoTerceirizadaViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = (
        ChamadoTerceirizada.objects
        .select_related('empresa_responsavel', 'chamado')
        .order_by('status_chamado', '-created_at')
    )
    serializer_class = ChamadoTerceirizadaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        empresa = self.request.query_params.get('empresa')
        status = self.request.query_params.get('status')
        if empresa:
            qs = qs.filter(empresa_responsavel_id=empresa)
        if status is not None and status != '':
            qs = qs.filter(status_chamado=status)
        return qs
