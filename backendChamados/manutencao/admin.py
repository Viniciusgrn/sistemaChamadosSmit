from django.contrib import admin

from .models import Manutencao


@admin.register(Manutencao)
class ManutencaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'equipamento', 'status', 'localizacao_atual_equipamento', 'backup', 'concluida_em')
    list_filter = ('status', 'backup')
    search_fields = ('equipamento__patrimonio', 'diagnostico', 'localizacao_atual_equipamento')
    raw_id_fields = ('equipamento', 'chamado', 'backup_feito_por')
    filter_horizontal = ('tecnicos',)
    list_select_related = ('equipamento',)
