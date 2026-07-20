from django.db import models
from core.models import BaseModel

class Automovel(BaseModel):

    COR_CHOICES=[
        (0,"Branco"),
        (1,"Preto"),
        (2,"Cinza"),
    ]

    STATUS_AUTOMOVEL_CHOICES=[
        (0,"Disponivel"),
        (1,"Manutenção"),
        (2,"Em uso"),
    ]

    marca = models.CharField(max_length=45)
    modelo = models.CharField(max_length=55)
    placa = models.CharField(max_length=8, unique=True)
    cor = models.IntegerField(choices=COR_CHOICES)
    status = models.IntegerField(choices=STATUS_AUTOMOVEL_CHOICES, default=0)
    assentos = models.IntegerField(default=2, help_text='Lugares — define os slots do lobby de equipe')

    def __str__(self):
        return f"{self.marca} | {self.modelo} | {self.get_cor_display()}"

class AgendaAutomovel(BaseModel):
    data_agendamento = models.DateTimeField()
    encerrado_em = models.DateTimeField(null=True, blank=True)
    motivo = models.CharField(max_length=255)
    tipo_agendamento = models.CharField(max_length=50, blank=True, default='')
    automovel = models.ForeignKey(Automovel, on_delete=models.PROTECT, related_name='agendamentos')