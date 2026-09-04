from django.http import FileResponse, Http404
from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from core.mixins import AuditMixin
from core.permissions import AprendizSomenteLeitura, SoQuemOperaOSistema
from .models import Documento
from .serializers import DocumentoSerializer


class DocumentoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Documento.objects.select_related('created_by').all()
    serializer_class = DocumentoSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        SoQuemOperaOSistema,
        # aprendiz consulta e baixa, mas não envia nem exclui
        AprendizSomenteLeitura,
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        busca = self.request.query_params.get('busca')
        if busca:
            qs = qs.filter(nome__icontains=busca)
        return qs

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        doc = self.get_object()
        try:
            arquivo = doc.arquivo.open('rb')
        except (FileNotFoundError, ValueError):
            raise Http404('Arquivo não encontrado no disco.')
        nome = doc.nome if doc.nome.lower().endswith('.pdf') else f'{doc.nome}.pdf'
        return FileResponse(arquivo, as_attachment=True, filename=nome)

    def perform_destroy(self, instance):
        # FileField não apaga o arquivo sozinho; sem isso o volume acumula
        # PDF órfão pra sempre
        arquivo = instance.arquivo
        super().perform_destroy(instance)
        arquivo.delete(save=False)
