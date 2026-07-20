from django.db import models
from django.contrib.auth.models import AbstractUser


class Usuario(AbstractUser):
    nome_completo = models.CharField(max_length=155)
    matricula = models.CharField(max_length=15, unique=True, null=True, blank=True)
    # False = divisão ainda não confirmada (import do AD veio sem divisão ou com
    # mais de uma candidata). Resolver pelo admin em "Pendências de divisão".
    divisao_definida = models.BooleanField(default=False)
    # True = ainda está com a senha inicial do import (Mudar@123).
    # O front mostra o alerta TROQUE SUA SENHA; zera na troca de senha.
    precisa_trocar_senha = models.BooleanField(default=False)
    # contexto do AD pra ajudar a resolver a pendência (candidatas, depto, cargo)
    obs_importacao = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    chefe_imediato = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinados')
    divisao = models.ForeignKey('unidade.Divisao', on_delete=models.PROTECT, null=True, blank=True,)
    unidade = models.ForeignKey('unidade.Unidade', on_delete=models.PROTECT, null=True, blank=True,)
    created_by = models.ForeignKey('self', on_delete=models.PROTECT, related_name='+', editable=False, null=True, blank=True)
    updated_by = models.ForeignKey('self', on_delete=models.PROTECT, related_name='+', editable=False, null=True, blank=True)

    def __str__(self):
        return f"{self.matricula} - {self.nome_completo}"


class SolicitacaoDivisao(models.Model):
    """
    Pedido de vínculo a uma divisão ("me aceita no setor X").
    Feito pelo próprio usuário no perfil (obrigatório pra quem está sem
    divisão e quer abrir chamado). Aprovada pelo chefe do setor ou pela DIT —
    ao aprovar, o usuário ganha divisao + divisao_definida=True.
    """
    STATUS_CHOICES = [
        (0, 'Pendente'),
        (1, 'Aprovada'),
        (2, 'Recusada'),
    ]

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='solicitacoes_divisao')
    divisao = models.ForeignKey('unidade.Divisao', on_delete=models.CASCADE, related_name='solicitacoes_entrada')
    status = models.IntegerField(choices=STATUS_CHOICES, default=0)
    decidido_por = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    decidido_em = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.usuario.username} → {self.divisao} ({self.get_status_display()})'