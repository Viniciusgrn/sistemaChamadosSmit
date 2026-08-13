from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.response import Response

from chamado.models import Chamado
from core.mixins import AuditMixin
from core.papeis import eh_aprendiz, coordena, CARGOS_SUPERVISIONADOS
from core.permissions import AprendizSomenteLeitura, CadastroDeTecnicoSoCoordenacao
from core.tempo import intervalo_do_dia
from .models import Tecnico, Equipe, Atendimento, ParticipacaoEquipe
from .serializers import TecnicoSerializer, EquipeSerializer, AtendimentoSerializer


class TecnicoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = (
        Tecnico.objects
        .select_related('usuario__unidade', 'usuario__divisao', 'usuario__chefe_imediato')
        .prefetch_related('responsabilidades_set', 'participacoes__equipe')
        .order_by('usuario__nome_completo')
    )
    serializer_class = TecnicoSerializer
    # Declarar aqui SUBSTITUI o DEFAULT_PERMISSION_CLASSES do settings, então as
    # duas padrão precisam ser repetidas — senão a rota ficaria aberta.
    permission_classes = [
        permissions.IsAuthenticated,
        AprendizSomenteLeitura,
        CadastroDeTecnicoSoCoordenacao,
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        disp = params.get('disponivel')
        resp = params.get('responsabilidade')
        if disp is not None and disp != '':
            qs = qs.filter(disponivel=disp.lower() in ('1', 'true', 'sim'))
        if resp is not None and resp != '':
            qs = qs.filter(responsabilidades_set__responsabilidade=resp)
        return qs.distinct()


class EquipeViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = (
        Equipe.objects
        .select_related('chamado_atual__unidade__endereco', 'automovel_utilizado')
        .prefetch_related(
            'participacoes__tecnico__usuario',
            'participacoes__tecnico__responsabilidades_set',
            'atendimentos__chamado',
        )
        .order_by('-created_at')
    )
    serializer_class = EquipeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        ativas = params.get('ativas')
        fase = params.get('fase')

        if ativas is not None and ativas != '':
            if ativas.lower() in ('1', 'true', 'sim'):
                qs = qs.filter(encerrada_em__isnull=True)
            else:
                qs = qs.filter(encerrada_em__isnull=False)

        if fase == 'lobby':
            qs = qs.filter(encerrada_em__isnull=True, chamado_atual__isnull=True)
        elif fase == 'em_campo':
            qs = qs.filter(encerrada_em__isnull=True, chamado_atual__isnull=False)
        elif fase == 'encerrada':
            qs = qs.filter(encerrada_em__isnull=False)

        if params.get('hoje'):
            inicio, fim = intervalo_do_dia()
            qs = qs.filter(created_at__gte=inicio, created_at__lt=fim)
        return qs

    # ---- helpers ----
    def _resposta(self, equipe):
        """
        Relê a equipe antes de serializar: as ações mexem em M2M e em objetos
        relacionados, e o cache do prefetch da instância original fica velho.
        """
        atual = self.get_queryset().filter(pk=equipe.pk).first()
        return Response(EquipeSerializer(atual or equipe).data)

    @staticmethod
    def _garante_aberta(equipe):
        if equipe.encerrada_em:
            raise ValidationError({'detail': 'Esta equipe já foi encerrada.'})

    @staticmethod
    def _tecnico_do_corpo(request):
        tecnico_id = request.data.get('tecnico_id')
        if not tecnico_id:
            raise ValidationError({'tecnico_id': 'Informe o técnico.'})
        tecnico = Tecnico.objects.filter(id=tecnico_id).first()
        if not tecnico:
            raise ValidationError({'tecnico_id': 'Técnico não encontrado.'})
        return tecnico

    @staticmethod
    def _eh_ele_mesmo(user, tecnico):
        return getattr(user, 'tecnico', None) is not None and user.tecnico.id == tecnico.id

    @staticmethod
    def _responde_pela_equipe(user, equipe):
        """É técnico pleno e está nesta equipe agora."""
        tecnico = getattr(user, 'tecnico', None)
        if tecnico is None or tecnico.cargo in CARGOS_SUPERVISIONADOS:
            return False
        return equipe.participacoes_abertas.filter(tecnico=tecnico).exists()

    def _garante_pode_mexer_em(self, user, tecnico, frase):
        """
        Montar equipe com OUTRAS pessoas é ato de coordenação.

        O técnico se auto-atribui (ou o sistema cria uma equipe solo pra ele
        quando ele vai direto pro chamado). Escalar terceiro é do despachante —
        e de quem coordena em geral (chefe, secretário, superusuário).
        """
        if self._eh_ele_mesmo(user, tecnico) or coordena(user):
            return
        raise PermissionDenied(
            f'Você só pode {frase}. Escalar outro técnico é com o administrativo.'
        )

    def perform_create(self, serializer):
        """
        Técnico abre equipe só quando está livre.

        Quem coordena monta lobby para os outros, então não entra nessa regra.
        Para o técnico, criar equipe é o passo antes de entrar nela — e ele não
        pode estar em duas (mesma regra que o `entrar` já aplica). Sem isso
        sobravam lobbies órfãos criados por quem já estava em campo.
        """
        user = self.request.user
        tecnico = getattr(user, 'tecnico', None)
        if tecnico is not None and not coordena(user):
            atual = ParticipacaoEquipe.objects.filter(
                tecnico=tecnico, saiu_em__isnull=True, equipe__encerrada_em__isnull=True,
            ).select_related('equipe').first()
            if atual:
                raise ValidationError({'detail': (
                    f'Você já está na equipe #{atual.equipe_id} — saia dela antes '
                    'de abrir outra.'
                )})
        # delega pro AuditMixin, que carimba created_by/updated_by
        super().perform_create(serializer)

    def perform_destroy(self, instance):
        # Atendimento aponta pra Equipe com PROTECT: só dá pra apagar quem
        # nunca foi a campo. Equipe com histórico se encerra, não se apaga.
        if instance.atendimentos.exists():
            raise ValidationError({
                'detail': 'Esta equipe já tem atendimentos registrados. Encerre-a em vez de excluir.'
            })
        instance.delete()

    # ---- ações do fluxo ----
    @action(detail=True, methods=['post'])
    def entrar(self, request, pk=None):
        """Abre a participação do técnico na equipe (respeitando os assentos)."""
        equipe = self.get_object()
        self._garante_aberta(equipe)
        tecnico = self._tecnico_do_corpo(request)
        self._garante_pode_mexer_em(request.user, tecnico, 'colocar você mesmo na equipe')

        if equipe.participacoes_abertas.filter(tecnico=tecnico).exists():
            raise ValidationError({'detail': 'Este técnico já está na equipe.'})

        # um técnico não pode estar em duas equipes abertas ao mesmo tempo.
        # Participação encerrada não conta: ele já saiu daquela.
        if ParticipacaoEquipe.objects.filter(
            tecnico=tecnico, saiu_em__isnull=True, equipe__encerrada_em__isnull=True,
        ).exclude(equipe_id=equipe.id).exists():
            raise ValidationError({'detail': 'Este técnico já está em outra equipe ativa.'})

        carro = equipe.automovel_utilizado
        if carro and carro.assentos and equipe.participacoes_abertas.count() >= carro.assentos:
            raise ValidationError({'detail': f'O veículo tem só {carro.assentos} assentos.'})

        # cargo supervisionado nunca fica sozinho: precisa de um técnico junto
        if tecnico.cargo in CARGOS_SUPERVISIONADOS and not self._tem_tecnico_pleno(equipe):
            raise ValidationError({'detail': (
                'Estagiário e jovem aprendiz não formam equipe sozinhos — '
                'um técnico precisa entrar primeiro.'
            )})

        ParticipacaoEquipe.objects.create(equipe=equipe, tecnico=tecnico)
        return self._resposta(equipe)

    @staticmethod
    def _tem_tecnico_pleno(equipe, ignorando=None):
        """A equipe tem alguém que pode responder por ela (cargo não supervisionado)?"""
        qs = equipe.participacoes_abertas.exclude(tecnico__cargo__in=CARGOS_SUPERVISIONADOS)
        if ignorando is not None:
            qs = qs.exclude(tecnico_id=ignorando)
        return qs.exists()

    @action(detail=True, methods=['post'])
    def sair(self, request, pk=None):
        """
        Fecha a participação do técnico — a linha fica, com `saiu_em` carimbado,
        pra que o histórico do período dentro da equipe não se perca.
        Se esvaziar o lobby (equipe que nunca foi a campo), a equipe some.
        """
        equipe = self.get_object()
        self._garante_aberta(equipe)
        tecnico = self._tecnico_do_corpo(request)

        # Sair da equipe é direito de qualquer um sobre si mesmo — inclusive do
        # aprendiz. Tirar TERCEIRO é que é coordenação; a exceção é o cargo
        # supervisionado, que o técnico da própria equipe pode tirar (senão ele
        # ficaria preso: a regra mais abaixo o impede de sair deixando aprendiz
        # sozinho).
        if not self._eh_ele_mesmo(request.user, tecnico):
            if tecnico.cargo in CARGOS_SUPERVISIONADOS:
                if not (coordena(request.user) or self._responde_pela_equipe(request.user, equipe)):
                    raise PermissionDenied(
                        'Só um técnico da própria equipe (ou o administrativo) pode '
                        'tirar estagiário ou aprendiz dela.'
                    )
            elif not coordena(request.user):
                raise PermissionDenied(
                    'Você só pode tirar você mesmo da equipe. '
                    'Escalar outro técnico é com o administrativo.'
                )

        participacao = equipe.participacoes_abertas.filter(tecnico=tecnico).first()
        if not participacao:
            raise ValidationError({'detail': 'Este técnico não está na equipe.'})

        # se ele é o último técnico pleno, sobrariam só supervisionados
        if tecnico.cargo not in CARGOS_SUPERVISIONADOS \
                and not self._tem_tecnico_pleno(equipe, ignorando=tecnico.id) \
                and equipe.participacoes_abertas.exclude(tecnico=tecnico).exists():
            raise ValidationError({'detail': (
                'Você é o único técnico da equipe — tire os estagiários/aprendizes '
                'antes de sair, ou peça que outro técnico entre.'
            )})

        participacao.encerrar()

        if not equipe.participacoes_abertas.exists() and not equipe.chamado_atual_id:
            # lobby vazio que nunca atendeu: não deixa rastro pra preservar
            if not equipe.atendimentos.exists():
                equipe.delete()
                return Response({'detail': 'Lobby desfeito (ficou sem técnicos).'})
        return self._resposta(equipe)

    @action(detail=True, methods=['post'])
    def despachar(self, request, pk=None):
        """Manda a equipe pro campo: vincula o chamado e abre o Atendimento."""
        equipe = self.get_object()
        self._garante_aberta(equipe)

        chamado_id = request.data.get('chamado_id')
        if not chamado_id:
            raise ValidationError({'chamado_id': 'Informe o chamado.'})
        chamado = Chamado.objects.filter(id=chamado_id).first()
        if not chamado:
            raise ValidationError({'chamado_id': 'Chamado não encontrado.'})
        if not equipe.participacoes_abertas.exists():
            raise ValidationError({'detail': 'A equipe precisa de pelo menos um técnico.'})
        if not self._tem_tecnico_pleno(equipe):
            raise ValidationError({'detail': (
                'Esta equipe só tem cargos supervisionados — um técnico precisa '
                'entrar antes de ir a campo.'
            )})
        if eh_aprendiz(request.user):
            raise PermissionDenied('Seu perfil não despacha equipe para chamado.')
        if chamado.status_chamado in Chamado.STATUS_ENCERRADOS:
            raise ValidationError({'detail': 'Este chamado já foi encerrado.'})

        # a equipe já está em outro chamado: trocar exige dizer em que status o
        # atual fica, e isso é o fluxo de /atender/ - aqui só recusa
        if equipe.chamado_atual_id and equipe.chamado_atual_id != chamado.id:
            atual = equipe.chamado_atual
            raise ValidationError({
                'detail': f'Esta equipe está atendendo o #{atual.id} ({atual.titulo}). '
                          'Encerre esse atendimento antes de despachá-la.'
            })

        # duas equipes no mesmo chamado dariam dois atendimentos concorrentes
        ocupada = chamado.equipes_atendendo_agora.filter(
            encerrada_em__isnull=True
        ).exclude(id=equipe.id).first()
        if ocupada:
            nomes = ', '.join(
                (t.usuario.nome_completo or t.usuario.username)
                for t in ocupada.tecnicos_ativos.select_related('usuario')
            )
            raise ValidationError({
                'detail': f'Este chamado já está em atendimento por {nomes or "outra equipe"}.'
            })

        equipe.chamado_atual = chamado
        equipe.save(update_fields=['chamado_atual', 'updated_at'])

        Atendimento.objects.create(equipe=equipe, chamado=chamado)

        # chamado sendo atendido passa a "Em andamento"
        if chamado.status_chamado == Chamado.ABERTO:
            chamado.status_chamado = Chamado.EM_ANDAMENTO
            chamado.save(update_fields=['status_chamado', 'updated_at'])

        return self._resposta(equipe)

    @action(detail=True, methods=['post'])
    def encerrar(self, request, pk=None):
        """
        Encerra a equipe (fim de turno/atendimento). Fecha o atendimento aberto
        com o motivo informado; motivo 0 (Resolvido) finaliza o chamado.
        """
        equipe = self.get_object()
        self._garante_aberta(equipe)

        motivo = request.data.get('motivo_encerramento')
        agora = timezone.now()

        aberto = equipe.atendimentos.filter(encerrado_em__isnull=True).first()
        if aberto:
            aberto.encerrado_em = agora
            aberto.motivo_encerramento = motivo
            aberto.observacoes = request.data.get('observacoes', '')
            aberto.save()

            if str(motivo) == '0' and aberto.chamado_id:
                c = aberto.chamado
                c.status_chamado = Chamado.FINALIZADO
                c.finalizado_em = agora
                c.save(update_fields=['status_chamado', 'finalizado_em', 'updated_at'])

        # quem ficou até o fim sai junto com a equipe: participação em aberto
        # numa equipe encerrada não faz sentido e bagunçaria o cálculo de horas
        equipe.participacoes_abertas.update(saiu_em=agora, updated_at=agora)

        equipe.encerrada_em = agora
        equipe.chamado_atual = None
        equipe.save(update_fields=['encerrada_em', 'chamado_atual', 'updated_at'])
        return self._resposta(equipe)


class AtendimentoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = (
        Atendimento.objects
        .select_related('chamado', 'equipe')
        .prefetch_related('equipe__participacoes__tecnico__usuario')
        .order_by('-iniciado_em')
    )
    serializer_class = AtendimentoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        equipe = params.get('equipe')
        tecnico = params.get('tecnico')
        if equipe:
            qs = qs.filter(equipe_id=equipe)
        if tecnico:
            # só o que aconteceu enquanto ele estava na equipe
            qs = qs.filter(pk__in=Atendimento.do_tecnico(tecnico).values('pk'))
        return qs
