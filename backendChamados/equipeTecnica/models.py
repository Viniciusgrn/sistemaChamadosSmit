from django.db import models
from core.models import BaseModel
from django.utils import timezone

class Tecnico(BaseModel):

    RESPONSABILIDADE_CHOICES=[
        (0,"Redes"),
        (1,"Infra"),
        (2,"Suporte"),
        (3,"Despachante"),
        (4,"Auditoria"),
    ]

    disponivel = models.BooleanField(default=1)
    responsabilidade = models.IntegerField(choices=RESPONSABILIDADE_CHOICES, default=2)
    usuario = models.OneToOneField('usuario.Usuario', on_delete=models.PROTECT, related_name='tecnico')

class Equipe(BaseModel):
    encerrada_em = models.DateTimeField(null=True, blank=True)
    chamado_atual = models.ForeignKey('chamado.Chamado', on_delete=models.PROTECT, null=True, blank=True, related_name='equipes_atendendo_agora')
    automovel_utilizado = models.ForeignKey('automovel.Automovel', on_delete=models.PROTECT, related_name='equipes_utilizadoras', null=True, blank=True)
    tecnicos = models.ManyToManyField('Tecnico', related_name='equipes')


class Atendimento(BaseModel):
    MOTIVO_ENCERRAMENTO_CHOICES = [
        (0, 'Resolvido'),
        (1, 'Transferido'),
        (2, 'Turno acabou'),
        (3, 'Cancelado'),
    ]

    equipe = models.ForeignKey('Equipe', on_delete=models.PROTECT, related_name='atendimentos')
    chamado = models.ForeignKey('chamado.Chamado', on_delete=models.PROTECT, related_name='atendimentos')
    iniciado_em = models.DateTimeField(default=timezone.now)
    encerrado_em = models.DateTimeField(null=True, blank=True)
    observacoes = models.TextField(blank=True)
    motivo_encerramento = models.IntegerField(choices=MOTIVO_ENCERRAMENTO_CHOICES, null=True, blank=True)