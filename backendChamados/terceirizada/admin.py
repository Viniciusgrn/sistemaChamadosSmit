from django.contrib import admin
from .models import EmpresaTerceirizada, ChamadoTerceirizada


@admin.register(EmpresaTerceirizada)
class EmpresaTerceirizadaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'responsabilidade', 'numero_telefone', 'link_site')
    list_filter = ('responsabilidade',)
    search_fields = ('nome', 'numero_telefone')


@admin.register(ChamadoTerceirizada)
class ChamadoTerceirizadaAdmin(admin.ModelAdmin):
    list_display = ('id', 'protocolo', 'titulo', 'empresa_responsavel', 'status_chamado', 'finalizado_em')
    list_filter = ('status_chamado', 'empresa_responsavel')
    search_fields = ('protocolo', 'titulo')
    raw_id_fields = ('empresa_responsavel', 'chamado')
    list_select_related = ('empresa_responsavel',)
