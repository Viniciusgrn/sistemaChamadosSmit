from django.db import models
from core.models import BaseModel

class EmpresaTerceirizada(BaseModel):

    RESPONSABILIDADE_CHOICES = [
        (0, 'Telefonia'),
        (1, 'Impressoras'),
        (2, 'Computadores'),
        (3, 'Câmeras'),
        (4, 'Provedor de Internet'),
    ]

    nome = models.CharField(max_length=150)
    numero_telefone = models.CharField(max_length=20)
    link_site = models.URLField(max_length=255, blank=True, null=True)
    responsabilidade = models.IntegerField(choices=RESPONSABILIDADE_CHOICES)

    def __str__(self):
        return self.nome

class ChamadoTerceirizada(BaseModel):

    STATUSCHAMADO_CHOICES = [
        (0, 'Aberto'),
        (1, 'Em andamento'),
        (2, 'Finalizado'),
        (3, 'Não resolvido'),
    ]

    titulo = models.CharField(max_length=155)
    descricao = models.TextField()
    protocolo = models.CharField(max_length=50) 
    finalizado_em = models.DateTimeField(null=True, blank=True)
    status_chamado = models.IntegerField(choices=STATUSCHAMADO_CHOICES, default=0)
    chamado = models.ForeignKey('chamado.Chamado', on_delete=models.PROTECT, related_name='delegacoes')
    empresa_responsavel = models.ForeignKey(EmpresaTerceirizada, on_delete=models.PROTECT, related_name='chamados')

    class Meta(BaseModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=['protocolo', 'empresa_responsavel'],
                name='protocolo_por_empresa'
            )
        ]

    def __str__(self):
        return f'Protocolo {self.protocolo} - {self.empresa_responsavel.nome}'
    
