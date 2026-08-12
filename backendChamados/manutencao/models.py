from django.db import models
from core.models import BaseModel

class Manutencao(BaseModel):

    MANUTENCAO_CHOICES = [
        (0,"Em andamento"),
        (1,"Finalizado"),
        (2,"Não foi possivel realizar manutenção"),
    ]

    diagnostico = models.TextField(blank=True)
    localizacao_atual_equipamento = models.CharField(max_length=255, null=True, blank=True)
    servico_executado = models.TextField(blank=True)
    concluida_em = models.DateTimeField(null=True, blank=True)
    backup = models.BooleanField(default=0)
    backup_data = models.DateTimeField(null=True, blank=True)
    status = models.IntegerField(choices=MANUTENCAO_CHOICES, default=0)
    backup_feito_por = models.ForeignKey("usuario.Usuario", on_delete=models.PROTECT, null=True, blank=True)
    # nem toda retirada nasce de um chamado: o técnico pode recolher o
    # equipamento por iniciativa própria (preventiva, vistoria, troca)
    chamado = models.ForeignKey(
        'chamado.Chamado', on_delete=models.PROTECT, null=True, blank=True,
        related_name='manutencoes',
    )
    # pra onde o equipamento vai quando a ordem encerra (espelha
    # Equipamento.STATUS_EQUIPAMENTO_CHOICES). Nem sempre volta pra "Em uso".
    destino_equipamento = models.IntegerField(
        choices=[(0, 'Em uso'), (1, 'Estoque'), (3, 'Descarte')],
        null=True, blank=True,
    )
    equipamento = models.ForeignKey('equipamento.Equipamento', on_delete=models.PROTECT)
    # a ordem pode ser aberta antes de designar quem vai executar
    tecnicos = models.ManyToManyField('equipeTecnica.Tecnico', related_name='manutencoes', blank=True)

    def __str__(self):
        return f"{self.diagnostico}, {self.localizacao_atual_equipamento}, {self.status}, {self.backup}"