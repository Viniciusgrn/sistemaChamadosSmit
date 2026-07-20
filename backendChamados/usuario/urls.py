from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, LoginView, LogoutView, SessaoAtualView, TrocarSenhaView,
    SolicitacaoDivisaoViewSet,
)

router = DefaultRouter()
router.register(r'contas', UsuarioViewSet, basename='usuario')
router.register(r'solicitacoes-divisao', SolicitacaoDivisaoViewSet, basename='solicitacaodivisao')

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('sessao/', SessaoAtualView.as_view()),
    path('trocar-senha/', TrocarSenhaView.as_view()),
    path('', include(router.urls)),
]
