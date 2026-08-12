from django.db import models
from core.models import BaseModel

class Chamado(BaseModel):

    ABERTO          = 0
    EM_ANDAMENTO    = 1
    FINALIZADO      = 2
    CANCELADO       = 3
    EM_MANUTENCAO   = 4   # virou ordem de manutenção (app manutencao)
    AGENDADO        = 5   # visita marcada para data futura
    EM_TERCEIRIZADA = 6   # encaminhado: quem resolve agora é a empresa contratada

    STATUS_CHAMADO_CHOICES = [
        (ABERTO,          "Aberto"),
        (EM_ANDAMENTO,    "Em andamento"),
        (AGENDADO,        "Agendado"),
        (EM_MANUTENCAO,   "Em manutenção"),
        (EM_TERCEIRIZADA, "Encaminhado p/ terceirizada"),
        (FINALIZADO,      "Finalizado"),
        (CANCELADO,       "Cancelado"),
    ]

    # estados que tiram o chamado da fila ativa
    STATUS_ENCERRADOS = (FINALIZADO, CANCELADO)

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
    # alguém definiu a urgência na mão: o escalonamento por tempo parado passa
    # a não opinar mais sobre este chamado (ver chamado/prioridade.py)
    urgencia_manual = models.BooleanField(
        default=False,
        help_text='Urgência definida por uma pessoa — congela o escalonamento automático.',
    )
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