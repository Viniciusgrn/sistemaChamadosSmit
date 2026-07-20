from django.db import models
from core.models import BaseModel


class Ramal(BaseModel):
    """
    Ramal interno do PABX da prefeitura (diretório telefônico).
    Fonte: ramais.txt — formato SETOR, NUMERO, OCUPANTE.

    `numero` NÃO é único: a base oficial repete ramais (recepção + pessoa no
    mesmo número, postos compartilhados). `ocupante` pode vir vazio ou "VAGO".
    `divisao` é vínculo opcional pra cruzar com a hierarquia de secretarias.
    """
    numero   = models.CharField(max_length=10, db_index=True)
    setor    = models.CharField(max_length=120, help_text='Rótulo do grupo no PABX (ex: OBRAS, JURÍDICO, SAUDE)')
    ocupante = models.CharField(max_length=150, blank=True, help_text='Nome/função; vazio ou "VAGO" = sem ocupante')
    divisao  = models.ForeignKey(
        'unidade.Divisao', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ramais',
    )

    class Meta(BaseModel.Meta):
        ordering = ['numero']

    @property
    def vago(self):
        return not self.ocupante.strip() or self.ocupante.strip().upper() == 'VAGO'

    def __str__(self):
        return f'{self.numero} — {self.ocupante or "vago"}'
