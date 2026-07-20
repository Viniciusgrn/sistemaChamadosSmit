from rest_framework import viewsets
from core.mixins import AuditMixin
from .models import Equipamento
from .serializers import EquipamentoSerializer


class EquipamentoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Equipamento.objects.select_related('unidade_atual').all()
    serializer_class = EquipamentoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        tipo = p.get('tipo')
        status = p.get('status')
        unidade = p.get('unidade')
        if tipo not in (None, ''):
            qs = qs.filter(tipo_equipamento=tipo)
        if status not in (None, ''):
            qs = qs.filter(status=status)
        if unidade not in (None, ''):
            qs = qs.filter(unidade_atual_id=unidade)
        return qs.order_by('patrimonio')
    
