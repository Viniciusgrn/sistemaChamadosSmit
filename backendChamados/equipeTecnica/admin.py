from django.contrib import admin

from .models import (
    Tecnico, Equipe, Atendimento, ResponsabilidadeTecnico, ParticipacaoEquipe,
)


class ResponsabilidadeInline(admin.TabularInline):
    model = ResponsabilidadeTecnico
    extra = 1


@admin.register(Tecnico)
class TecnicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'cargo', 'disponivel')
    list_filter = ('cargo', 'disponivel')
    search_fields = ('usuario__nome_completo', 'usuario__username', 'usuario__matricula')
    autocomplete_fields = ('usuario',)
    list_select_related = ('usuario',)
    inlines = [ResponsabilidadeInline]


class ParticipacaoInline(admin.TabularInline):
    """Entradas e saídas da equipe. Linha com `saiu_em` vazio = ainda dentro."""
    model = ParticipacaoEquipe
    extra = 0
    raw_id_fields = ('tecnico',)


@admin.register(Equipe)
class EquipeAdmin(admin.ModelAdmin):
    list_display = ('id', 'chamado_atual', 'automovel_utilizado', 'encerrada_em')
    list_filter = ('encerrada_em',)
    raw_id_fields = ('chamado_atual',)
    inlines = [ParticipacaoInline]


@admin.register(ParticipacaoEquipe)
class ParticipacaoEquipeAdmin(admin.ModelAdmin):
    list_display = ('id', 'tecnico', 'equipe', 'entrou_em', 'saiu_em')
    list_filter = ('saiu_em',)
    raw_id_fields = ('tecnico', 'equipe')


@admin.register(Atendimento)
class AtendimentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'chamado', 'equipe', 'iniciado_em', 'encerrado_em', 'motivo_encerramento')
    list_filter = ('motivo_encerramento',)
    raw_id_fields = ('chamado', 'equipe')
