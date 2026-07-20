from django.contrib import admin
from .forms import SalaAdminForm
from .models import (
    Bairro, Endereco, Secretaria, Divisao, Unidade,
    TelefoneUnidade, EmailUnidade, ResponsavelUnidade,
    Predio, PlantaAndar, Sala,
)


@admin.register(Endereco)
class EnderecoAdmin(admin.ModelAdmin):
    """
    Edição inline de coordenadas. Filtre por 'geo_precisao' pra ver só os
    imprecisos (bairro/centro), cole lat/long do Google Maps e marque 'manual'.
    """
    list_display = ('id', 'rua', 'numero', 'bairro', 'latitude', 'longitude', 'geo_precisao')
    list_editable = ('latitude', 'longitude', 'geo_precisao')
    list_filter = ('geo_precisao', 'bairro__rural', 'bairro')
    search_fields = ('rua', 'numero', 'ponto_referencia', 'bairro__nome')
    list_per_page = 50
    list_select_related = ('bairro',)


@admin.register(Bairro)
class BairroAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'rural')
    list_filter = ('rural',)
    search_fields = ('nome',)


@admin.register(Secretaria)
class SecretariaAdmin(admin.ModelAdmin):
    list_display = ('id', 'sigla', 'nome', 'cor')
    search_fields = ('nome', 'sigla')


@admin.register(Divisao)
class DivisaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'sigla', 'secretaria')
    list_filter = ('secretaria',)
    search_fields = ('nome', 'sigla')
    list_select_related = ('secretaria',)


class TelefoneInline(admin.TabularInline):
    model = TelefoneUnidade
    extra = 0


class EmailInline(admin.TabularInline):
    model = EmailUnidade
    extra = 0


class ResponsavelInline(admin.TabularInline):
    model = ResponsavelUnidade
    extra = 0


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'divisao', 'endereco', 'paco_municipal')
    list_filter = ('paco_municipal', 'divisao__secretaria')
    search_fields = ('nome', 'email')
    list_select_related = ('divisao', 'endereco')
    inlines = [TelefoneInline, EmailInline, ResponsavelInline]


class SalaInline(admin.TabularInline):
    model = Sala
    extra = 0
    fields = ('divisao', 'label', 'editar_poligono')
    readonly_fields = ('editar_poligono',)
    autocomplete_fields = ('divisao',)
    show_change_link = True

    @admin.display(description='Polígono')
    def editar_poligono(self, obj):
        from django.utils.html import format_html
        if not obj or not obj.pk:
            return 'Salve para desenhar o polígono'
        n = len(obj.pontos or [])
        return format_html('{} vértice{} — abra a sala pra editar', n, '' if n == 1 else 's')


@admin.register(PlantaAndar)
class PlantaAndarAdmin(admin.ModelAdmin):
    list_display = ('id', 'predio', 'andar', 'nome')
    list_filter = ('predio',)
    inlines = [SalaInline]


@admin.register(Predio)
class PredioAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'endereco')
    search_fields = ('nome',)


@admin.register(Sala)
class SalaAdmin(admin.ModelAdmin):
    form = SalaAdminForm
    fields = ('planta', 'divisao', 'label', 'pontos')
    list_display = ('id', '__str__', 'divisao', 'planta')
    list_filter = ('planta__predio', 'planta__andar', 'divisao__secretaria')
    list_select_related = ('divisao__secretaria', 'planta__predio')
    autocomplete_fields = ('divisao',)
