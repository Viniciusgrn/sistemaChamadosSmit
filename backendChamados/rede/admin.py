from django.contrib import admin

from .models import DispositivoRede, RedeWifi


# Senhas NÃO aparecem no admin nem cifradas: quem precisa delas usa a tela do
# sistema, que registra auditoria via API. O admin serve pra conferência.
@admin.register(DispositivoRede)
class DispositivoRedeAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome_na_rede', 'tipo', 'ip', 'unidade')
    list_filter = ('tipo', 'unidade__divisao__secretaria')
    search_fields = ('nome_na_rede', 'ip', 'unidade__nome')
    exclude = ('senha_acesso',)
    list_select_related = ('unidade',)


@admin.register(RedeWifi)
class RedeWifiAdmin(admin.ModelAdmin):
    list_display = ('id', 'ssid', 'unidade', 'oculta', 'visitantes')
    list_filter = ('oculta', 'visitantes')
    search_fields = ('ssid', 'unidade__nome')
    exclude = ('senha',)
    list_select_related = ('unidade',)
