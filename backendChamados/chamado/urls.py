from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChamadoViewSet

router = DefaultRouter()
router.register(r'tickets', ChamadoViewSet, basename='chamado')

urlpatterns = [
    path('', include(router.urls)),
]