from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TecnicoViewSet, EquipeViewSet, AtendimentoViewSet

router = DefaultRouter()
router.register(r'profissionais', TecnicoViewSet, basename='tecnico')
router.register(r'formacoes', EquipeViewSet, basename='equipe')
router.register(r'historico-atendimentos', AtendimentoViewSet, basename='atendimento')

urlpatterns = [
    path('', include(router.urls)),
]