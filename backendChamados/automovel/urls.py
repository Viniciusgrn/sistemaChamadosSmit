from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AutomovelViewSet, AgendaAutomovelViewSet

router = DefaultRouter()
router.register(r'veiculos', AutomovelViewSet, basename='automovel')
router.register(r'agendamentos', AgendaAutomovelViewSet, basename='agendaautomovel')

urlpatterns = [
    path('', include(router.urls)),
]