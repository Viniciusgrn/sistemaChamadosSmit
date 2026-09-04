from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/automovel/', include('automovel.urls')),
    path('api/localidades/', include('unidade.urls')),
    path('api/equipamento/', include('equipamento.urls')),
    path('api/manutencao/', include('manutencao.urls')),
    path('api/terceirizada/', include('terceirizada.urls')),
    path('api/ramal/', include('ramal.urls')),
    path('api/rede/', include('rede.urls')),
    path('api/documentos/', include('documento.urls')),
    path('api/equipes/', include('equipeTecnica.urls')),
    path('api/chamados/', include('chamado.urls')),
    path('api/usuarios/', include('usuario.urls')),
]

# Serve uploads (plantas) em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
