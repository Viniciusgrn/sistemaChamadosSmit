from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaTerceirizadaViewSet, ChamadoTerceirizadaViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaTerceirizadaViewSet, basename='empresaterceirizada')
router.register(r'chamados-externos', ChamadoTerceirizadaViewSet, basename='chamadoterceirizada')

urlpatterns = [
    path('', include(router.urls)),
]