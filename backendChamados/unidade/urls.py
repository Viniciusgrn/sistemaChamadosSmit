from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (BairroViewSet, EnderecoViewSet, SecretariaViewSet, DivisaoViewSet, UnidadeViewSet, PredioViewSet)

router = DefaultRouter()
router.register(r'bairros', BairroViewSet, basename='bairro')
router.register(r'enderecos', EnderecoViewSet, basename='endereco')
router.register(r'secretarias', SecretariaViewSet, basename='secretaria')
router.register(r'divisoes', DivisaoViewSet, basename='divisao')
router.register(r'unidades', UnidadeViewSet, basename='unidade')
router.register(r'predios', PredioViewSet, basename='predio')

urlpatterns = [
    path('', include(router.urls)),
]