from django.contrib import admin

from .models import Documento


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'created_by', 'created_at')
    search_fields = ('nome',)
    list_select_related = ('created_by',)
