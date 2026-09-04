from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DispositivoRedeViewSet, RedeWifiViewSet

router = DefaultRouter()
router.register(r'dispositivos', DispositivoRedeViewSet, basename='dispositivo-rede')
router.register(r'wifi', RedeWifiViewSet, basename='rede-wifi')

urlpatterns = [
    path('', include(router.urls)),
]
