from rest_framework import viewsets
from core.mixins import AuditMixin
from .models import Tecnico, Equipe, Atendimento
from .serializers import TecnicoSerializer, EquipeSerializer, AtendimentoSerializer

class TecnicoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Tecnico.objects.all()
    serializer_class = TecnicoSerializer

class EquipeViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Equipe.objects.all()
    serializer_class = EquipeSerializer

    def entrarEquipe(self):
        tec = Tecnico.__getattribute__(self)
        chamadoRequest = self.get_renderers()
        Equipe.__getattribute__(self, tec.get('id'), chamadoRequest)

class AtendimentoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Atendimento.objects.all()
    serializer_class = AtendimentoSerializer


