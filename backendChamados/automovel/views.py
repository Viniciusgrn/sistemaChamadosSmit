from rest_framework import viewsets
from core.mixins import AuditMixin
from .models import Automovel, AgendaAutomovel
from .serializers import AutomovelSerializer, AgendaAutomovelSerializer


class AutomovelViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Automovel.objects.all().order_by('placa')
    serializer_class = AutomovelSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param is not None and status_param != '':
            qs = qs.filter(status=status_param)
        return qs


class AgendaAutomovelViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = AgendaAutomovel.objects.select_related('automovel').all()
    serializer_class = AgendaAutomovelSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        automovel_id = self.request.query_params.get('automovel')
        if automovel_id:
            qs = qs.filter(automovel_id=automovel_id)
        return qs.order_by('data_agendamento')
    
    