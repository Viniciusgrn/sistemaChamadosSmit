from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.mixins import AuditMixin
from .models import Bairro, Endereco, Secretaria, Divisao, Unidade, Predio
from .serializers import (
    BairroSerializer, EnderecoSerializer, SecretariaSerializer,
    DivisaoSerializer, UnidadeSerializer, PredioSerializer,
)
from .geo import unidades_mais_proximas


class PredioViewSet(AuditMixin, viewsets.ReadOnlyModelViewSet):
    """Prédios com planta interna (Paço etc). Read-only por enquanto."""
    queryset = (
        Predio.objects
        .select_related('endereco__bairro')
        .prefetch_related('plantas__salas__divisao__secretaria')
        .all()
    )
    serializer_class = PredioSerializer


class BairroViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Bairro.objects.all().order_by('nome')
    serializer_class = BairroSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        rural = self.request.query_params.get('rural')
        if rural is not None:
            qs = qs.filter(rural=rural.lower() in ('1', 'true', 'sim'))
        return qs


class EnderecoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Endereco.objects.select_related('bairro').all()
    serializer_class = EnderecoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        bairro_id = self.request.query_params.get('bairro')
        if bairro_id:
            qs = qs.filter(bairro_id=bairro_id)
        return qs


class SecretariaViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Secretaria.objects.all().order_by('nome')
    serializer_class = SecretariaSerializer

class SecretariaEditView(AuditMixin, viewsets.ModelViewSet): #revisar essa classe
    queryset = Secretaria.objects.all().order_by('nome')
    serializer_class = SecretariaSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        bairro_id = self.request.query_params.get('bairro')
        if bairro_id:
            qs = qs.filter(bairro_id=bairro_id)
        return qs

class DivisaoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Divisao.objects.select_related('secretaria').all()
    serializer_class = DivisaoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        secretaria_id = self.request.query_params.get('secretaria')
        if secretaria_id:
            qs = qs.filter(secretaria_id=secretaria_id)
        return qs


class UnidadeViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Unidade.objects.select_related(
        'endereco__bairro', 'divisao__secretaria', 'responsavel'
    ).all()
    serializer_class = UnidadeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        divisao_id = self.request.query_params.get('divisao')
        secretaria_id = self.request.query_params.get('secretaria')
        paco = self.request.query_params.get('paco_municipal')
        if divisao_id:
            qs = qs.filter(divisao_id=divisao_id)
        if secretaria_id:
            qs = qs.filter(divisao__secretaria_id=secretaria_id)
        if paco is not None:
            qs = qs.filter(paco_municipal=paco.lower() in ('1', 'true', 'sim'))
        return qs

    @action(detail=False, methods=['get'], url_path='proximas')
    def proximas(self, request):
        """
        GET /api/localidades/unidades/proximas/?lat=-22.95&lng=-46.54&limite=5

        Retorna as N unidades mais próximas do ponto informado (geopy, em memória).
        """
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return Response({'detail': 'Parâmetros lat e lng obrigatórios e numéricos.'}, status=400)

        try:
            limite = int(request.query_params.get('limite', 5))
        except ValueError:
            limite = 5

        unidades = list(self.get_queryset())
        proximas = unidades_mais_proximas(unidades, (lat, lng), limite=limite)

        data = []
        for unidade, distancia_km in proximas:
            payload = UnidadeSerializer(unidade, context={'request': request}).data
            payload['distancia_km'] = round(distancia_km, 3)
            data.append(payload)
        return Response(data)
    
    

