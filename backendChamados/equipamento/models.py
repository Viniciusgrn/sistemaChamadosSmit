from django.db import models
from core.models import BaseModel

class Equipamento(BaseModel):

    TIPO_EQUIPAMENTO_CHOICES = [
        (0,"Impressora"),
        (1,"Computador"),
        (2,"Monitor"),
        (3,"Telefone"),
    ]

    STATUS_EQUIPAMENTO_CHOICES = [
        (0,"Em uso"),
        (1,"Estoque"),
        (2,"Em manutenção"),
        (3,"Descarte"),
    ]

    modelo_equipamento = models.CharField(max_length=255)
    patrimonio = models.CharField(max_length=8, unique=True, blank=True, null=True)
    numero_de_serie = models.CharField(max_length=50, unique=True, blank=True, null=True)
    marca = models.CharField(max_length=50) 
    tipo_equipamento = models.IntegerField(choices=TIPO_EQUIPAMENTO_CHOICES)
    status = models.IntegerField(choices=STATUS_EQUIPAMENTO_CHOICES, default=0)
    unidade_atual = models.ForeignKey('unidade.Unidade', on_delete=models.PROTECT, blank=True, null=True)
