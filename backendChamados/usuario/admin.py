from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario, SolicitacaoDivisao


@admin.register(SolicitacaoDivisao)
class SolicitacaoDivisaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'divisao', 'status', 'created_at', 'decidido_por', 'decidido_em')
    list_filter = ('status', 'divisao__secretaria')
    search_fields = ('usuario__username', 'usuario__nome_completo')
    list_select_related = ('usuario', 'divisao', 'decidido_por')
    autocomplete_fields = ('usuario', 'divisao')


class PendenciaDivisao(Usuario):
    """Proxy: usuários importados do AD ainda sem divisão confirmada."""
    class Meta:
        proxy = True
        verbose_name = 'Pendência de divisão'
        verbose_name_plural = 'Pendências de divisão'


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'nome_completo', 'matricula', 'divisao', 'divisao_definida', 'is_active')
    list_filter = ('divisao_definida', 'is_active', 'is_staff', 'divisao__secretaria')
    search_fields = ('username', 'nome_completo', 'email', 'matricula')
    autocomplete_fields = ('divisao', 'unidade', 'chefe_imediato')
    list_select_related = ('divisao',)
    fieldsets = UserAdmin.fieldsets + (
        ('Prefeitura', {'fields': (
            'nome_completo', 'matricula', 'divisao', 'divisao_definida',
            'unidade', 'chefe_imediato', 'obs_importacao',
        )}),
    )
    readonly_fields = ('obs_importacao',)


@admin.register(PendenciaDivisao)
class PendenciaDivisaoAdmin(admin.ModelAdmin):
    """
    Fila de resolução: só usuários com divisao_definida=False.
    Abra a pessoa, escolha a divisão (as candidatas do AD estão nas
    observações) e salve — a pendência some da lista.
    """
    list_display = ('username', 'nome_completo', 'resumo_obs', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('username', 'nome_completo', 'email')
    fields = ('username', 'nome_completo', 'obs_importacao', 'divisao', 'divisao_definida')
    readonly_fields = ('username', 'nome_completo', 'obs_importacao')
    autocomplete_fields = ('divisao',)
    actions = ['marcar_definida']
    list_per_page = 50

    def get_queryset(self, request):
        return super().get_queryset(request).filter(divisao_definida=False).select_related('divisao')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description='Contexto do AD')
    def resumo_obs(self, obj):
        return (obj.obs_importacao[:120] + '…') if len(obj.obs_importacao) > 120 else (obj.obs_importacao or '—')

    def save_model(self, request, obj, form, change):
        # escolher uma divisão resolve a pendência automaticamente
        if obj.divisao_id:
            obj.divisao_definida = True
        super().save_model(request, obj, form, change)

    @admin.action(description='Marcar como definida (sem divisão — ex: aposentado, externo)')
    def marcar_definida(self, request, queryset):
        n = queryset.update(divisao_definida=True)
        self.message_user(request, f'{n} usuário(s) marcados como definidos.')
