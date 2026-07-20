from django.db import models
from core.models import BaseModel

class Chamado(BaseModel):

    STATUS_CHAMADO_CHOICES = [
        (0, "Aberto"),
        (1, "Em andamento"),
        (2, "Finalizado"),
    ]

    URGENCIA_CHOICES = [
        (0, "Baixa"),
        (1, "Média"),
        (2, "Alta"),
        (3, "Crítica"),
    ]

    TIPO_CHAMADO_CHOICES =[
        (0, "Helpdesk"),
        (1, "Manutenção"),
        (2, "Requisição"),
        (3, "Suporte"),
        #(4, ""),        
    ]

    titulo = models.CharField(max_length=155)
    descricao = models.TextField()
    nome_solicitante = models.CharField(max_length=155) 
    finalizado_em = models.DateTimeField(null=True, blank=True)
    urgencia = models.IntegerField(choices=URGENCIA_CHOICES, default=0)
    status_chamado = models.IntegerField(choices=STATUS_CHAMADO_CHOICES, default=0)
    tipo_chamado = models.IntegerField(choices=TIPO_CHAMADO_CHOICES, default=0)
    unidade = models.ForeignKey('unidade.Unidade', on_delete=models.PROTECT)
    solicitante = models.ForeignKey('usuario.Usuario', on_delete=models.PROTECT)
    equipes = models.ManyToManyField('equipeTecnica.Equipe', through='equipeTecnica.Atendimento', related_name='chamados')
    equipamentos = models.ManyToManyField('equipamento.Equipamento', related_name='chamados', blank=True) 

    def __str__(self):
        return f"#{self.id} - {self.titulo}"

    class Meta(BaseModel.Meta):
        ordering = ['-created_at']