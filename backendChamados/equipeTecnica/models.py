from django.db import models
from core.models import BaseModel
from django.utils import timezone

class Tecnico(BaseModel):
    """
    Servidor da DIT que atende chamados. Nome/matrícula/unidade vêm do Usuario;
    aqui ficam só os atributos de trabalho (disponibilidade e especialidades).
    """
    RESPONSABILIDADE_CHOICES = [
        (0, "Redes"),
        (1, "Infra"),
        (2, "Suporte"),
        (3, "Despachante"),
        (4, "Help desk"),
    ]

    CARGO_CHOICES = [
        (0, "Técnico"),
        (1, "Estagiário"),
        (2, "Jovem aprendiz"),
    ]

    disponivel = models.BooleanField(default=True)
    cargo = models.IntegerField(choices=CARGO_CHOICES, default=0)
    usuario = models.OneToOneField('usuario.Usuario', on_delete=models.PROTECT, related_name='tecnico')

    def __str__(self):
        return self.usuario.nome_completo or self.usuario.username


class ResponsabilidadeTecnico(BaseModel):
    """
    Especialidades do técnico (N por técnico) - um mesmo técnico pode ser
    de Redes e Infra ao mesmo tempo.
    """
    tecnico = models.ForeignKey(
        Tecnico, on_delete=models.CASCADE, related_name='responsabilidades_set'
    )
    responsabilidade = models.IntegerField(choices=Tecnico.RESPONSABILIDADE_CHOICES)

    class Meta(BaseModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=['tecnico', 'responsabilidade'],
                name='unica_responsabilidade_por_tecnico',
            )
        ]

    def __str__(self):
        return f'{self.tecnico} - {self.get_responsabilidade_display()}'

class Equipe(BaseModel):
    encerrada_em = models.DateTimeField(null=True, blank=True)
    chamado_atual = models.ForeignKey('chamado.Chamado', on_delete=models.PROTECT, null=True, blank=True, related_name='equipes_atendendo_agora')
    automovel_utilizado = models.ForeignKey('automovel.Automovel', on_delete=models.PROTECT, related_name='equipes_utilizadoras', null=True, blank=True)
    # Histórico: `tecnicos` traz TODO mundo que já passou pela equipe (quem saiu
    # inclusive). Pra "quem está na equipe agora", use tecnicos_ativos.
    tecnicos = models.ManyToManyField(
        'Tecnico', through='ParticipacaoEquipe', related_name='equipes'
    )

    @property
    def participacoes_abertas(self):
        return self.participacoes.filter(saiu_em__isnull=True)

    @property
    def tecnicos_ativos(self):
        """Técnicos que ainda não saíram - é isto que define a equipe hoje."""
        return Tecnico.objects.filter(
            participacoes__equipe=self, participacoes__saiu_em__isnull=True
        )


class ParticipacaoEquipe(BaseModel):
    """
    Período de um técnico dentro de uma equipe. Existe pra que sair da equipe
    não apague o passado: a linha permanece com `saiu_em` carimbado, e o
    histórico/horas do técnico continuam contando o que ele de fato atendeu.

    `saiu_em` nulo = ainda está na equipe.
    """
    equipe = models.ForeignKey(
        Equipe, on_delete=models.CASCADE, related_name='participacoes'
    )
    tecnico = models.ForeignKey(
        Tecnico, on_delete=models.PROTECT, related_name='participacoes'
    )
    entrou_em = models.DateTimeField(default=timezone.now)
    saiu_em = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ['entrou_em']
        constraints = [
            # o mesmo técnico pode reentrar na equipe depois, mas nunca ter
            # duas participações abertas na mesma equipe ao mesmo tempo.
            # Atenção: o MySQL ignora constraint com condição (W036), então
            # quem garante isso de fato é a checagem na action /entrar/.
            models.UniqueConstraint(
                fields=['equipe', 'tecnico'],
                condition=models.Q(saiu_em__isnull=True),
                name='unica_participacao_aberta_por_equipe',
            )
        ]

    def __str__(self):
        return f'{self.tecnico} @ equipe {self.equipe_id}'

    def encerrar(self, quando=None):
        self.saiu_em = quando or timezone.now()
        self.save(update_fields=['saiu_em', 'updated_at'])


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

    @staticmethod
    def _sobrepoe_participacao():
        """
        Filtro de sobreposição entre o atendimento e o período do técnico na
        equipe: ele entrou antes do atendimento acabar E saiu depois de ele
        começar. Datas nulas (`encerrado_em`/`saiu_em`) significam "em curso",
        ou seja, ainda se sobrepõem.
        """
        return (
            models.Q(equipe__participacoes__entrou_em__lte=models.F('encerrado_em'))
            | models.Q(encerrado_em__isnull=True),
            models.Q(equipe__participacoes__saiu_em__gte=models.F('iniciado_em'))
            | models.Q(equipe__participacoes__saiu_em__isnull=True),
        )

    @classmethod
    def do_tecnico(cls, tecnico_id):
        """
        Histórico do técnico: só os atendimentos que aconteceram enquanto ele
        estava na equipe. Sair da equipe não apaga o que já foi atendido, e
        entrar depois não credita o que já tinha acontecido.
        """
        return cls.objects.filter(
            *cls._sobrepoe_participacao(),
            equipe__participacoes__tecnico_id=tecnico_id,
        ).distinct()