from django.db import models

from core.models import BaseModel


class DispositivoRede(BaseModel):
    """
    Um equipamento na rede de uma unidade: o switch da escola, o roteador do
    posto, a impressora de rede, o DVR das câmeras.

    `equipamento` liga ao patrimônio quando ele existe no cadastro — mas é
    opcional de propósito: o mapeamento não pode esperar o patrimônio estar em
    dia pra ser útil.

    `senha_acesso` é gravada CIFRADA (rede/cifra.py). Nunca leia ou escreva o
    campo direto fora do serializer.
    """
    # os números não se reaproveitam: 2 era 'Access point' e foi removido —
    # renumerar mudaria o significado do que já está gravado no banco
    TIPO_CHOICES = [
        (0, 'Roteador'),
        (1, 'Switch'),
        (3, 'Servidor'),
        (4, 'Impressora'),
        (5, 'Câmera'),
        (6, 'Outro'),
    ]

    unidade = models.ForeignKey('unidade.Unidade', on_delete=models.PROTECT, related_name='dispositivos_rede')
    equipamento = models.ForeignKey(
        'equipamento.Equipamento', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='dispositivos_rede',
    )
    tipo = models.IntegerField(choices=TIPO_CHOICES, default=6)
    # como a máquina aparece na rede (hostname/identificação)
    nome_na_rede = models.CharField(max_length=100)
    # texto livre em vez de GenericIPAddressField: aceita "192.168.0.10:8080",
    # faixa DHCP, IPv6 ou "IP dinâmico" — o mapeamento reflete a realidade
    ip = models.CharField(max_length=100, blank=True, default='')
    usuario_acesso = models.CharField(max_length=100, blank=True, default='')
    senha_acesso = models.TextField(blank=True, default='')
    observacoes = models.TextField(blank=True, default='')

    class Meta(BaseModel.Meta):
        ordering = ['unidade__nome', 'tipo', 'nome_na_rede']

    def __str__(self):
        return f'{self.nome_na_rede} ({self.get_tipo_display()}) - {self.unidade.nome}'


class RedeWifi(BaseModel):
    """
    Uma rede Wi-Fi da unidade (SSID + senha).

    Entidade separada do dispositivo porque a relação não é 1:1 — dois access
    points podem emitir a mesma rede, e um AP pode emitir duas. `emitida_por`
    aponta pro dispositivo principal quando fizer sentido.
    """
    unidade = models.ForeignKey('unidade.Unidade', on_delete=models.PROTECT, related_name='redes_wifi')
    ssid = models.CharField(max_length=100)
    # cifrada, mesma regra do dispositivo
    senha = models.TextField(blank=True, default='')
    emitida_por = models.ForeignKey(
        DispositivoRede, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='redes_emitidas',
    )
    # rede escondida ou de visitante são os dois atributos que mudam o suporte
    oculta = models.BooleanField(default=False)
    visitantes = models.BooleanField(default=False, help_text='Rede aberta a visitantes (sem acesso interno).')
    observacoes = models.TextField(blank=True, default='')

    class Meta(BaseModel.Meta):
        ordering = ['unidade__nome', 'ssid']

    def __str__(self):
        return f'{self.ssid} - {self.unidade.nome}'
