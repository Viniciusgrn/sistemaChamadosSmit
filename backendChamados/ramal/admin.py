from django.contrib import admin
from .models import Ramal


@admin.register(Ramal)
class RamalAdmin(admin.ModelAdmin):
    list_display = ('numero', 'ocupante', 'setor', 'divisao')
    list_filter = ('setor',)
    search_fields = ('numero', 'ocupante', 'setor')
    list_select_related = ('divisao',)
    autocomplete_fields = ('divisao',)
    list_per_page = 50
