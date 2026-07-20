from rest_framework import viewsets
from core.mixins import AuditMixin
from .models import Ramal
from .serializers import RamalSerializer


class RamalViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Ramal.objects.all().order_by('numero')
    serializer_class = RamalSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        setor = self.request.query_params.get('setor')
        if setor:
            qs = qs.filter(setor__iexact=setor)
        return qs
