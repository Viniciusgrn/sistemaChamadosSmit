from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RamalViewSet

router = DefaultRouter()
router.register(r'ramais', RamalViewSet, basename='ramal')

urlpatterns = [
    path('', include(router.urls)),
]
