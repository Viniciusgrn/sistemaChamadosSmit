from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EquipamentoViewSet

router = DefaultRouter()
router.register(r'ativos', EquipamentoViewSet, basename='equipamento')

urlpatterns = [
    path('', include(router.urls)),    
]