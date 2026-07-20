from rest_framework import viewsets
from core.mixins import AuditMixin
from .models import Manutencao
from .serializers import ManutencaoSerializer

class ManutencaoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Manutencao.objects.all()
    serializer_class = ManutencaoSerializer
