from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.response import Response

from core.mixins import AuditMixin
from core.papeis import opera_sistema, eh_aprendiz, eh_da_ti
from .prioridade import urgencia_de_abertura
from unidade.models import Unidade
from usuario.models import Usuario
from .models import Chamado
from .serializers import ChamadoSerializer


# quem opera o sistema (TI, técnicos e superusuário) - regra em core.papeis
_eh_dit = opera_sistema


def _subordinados_ids(user):
    """Fecho transitivo de subordinados via chefe_imediato (BFS)."""
    ids, fronteira = set(), [user.id]
    while fronteira:
        novos = [
            i for i in Usuario.objects
            .filter(chefe_imediato_id__in=fronteira)
            .values_list('id', flat=True)
            if i not in ids
        ]
        ids.update(novos)
        fronteira = novos
    return ids


class ChamadoViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Chamado.objects.select_related(
        'unidade__divisao__secretaria', 'unidade__endereco__bairro', 'solicitante'
    ).prefetch_related(
        'equipes_atendendo_agora__participacoes__tecnico__usuario',
        'equipes_atendendo_agora__automovel_utilizado',
        'delegacoes__empresa_responsavel',
    ).all()
    serializer_class = ChamadoSerializer

    @staticmethod
    def _cond_visivel(user):
        """
        Escopo por papel:
          - secretário: tudo da(s) secretaria(s) que chefia
          - chefe: os próprios + divisões de todos os subordinados (recursivo)
          - servidor comum: os próprios + os da própria divisão
        """
        cond = Q(solicitante=user)
        secretarias = list(user.secretarias_chefiadas.values_list('id', flat=True))
        if secretarias:
            cond |= Q(unidade__divisao__secretaria_id__in=secretarias)
        else:
            divisoes = set()
            if user.divisao_id:
                divisoes.add(user.divisao_id)
            subs = _subordinados_ids(user)
            if subs:
                divisoes.update(
                    Usuario.objects.filter(id__in=subs, divisao__isnull=False)
                    .values_list('divisao_id', flat=True)
                )
            if divisoes:
                cond |= Q(unidade__divisao_id__in=divisoes)
        return cond

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        params = self.request.query_params

        if params.get('meus'):
            # mais restrito que o escopo por papel: só o que ele mesmo abriu
            qs = qs.filter(solicitante=user)
        elif not _eh_dit(user):
            # Escopo SEMPRE aplicado a quem não opera o sistema — não depende de
            # o cliente pedir. Antes o filtro exigia `visiveis=1` na query, o que
            # deixava a lista inteira acessível a qualquer servidor logado que
            # simplesmente omitisse o parâmetro (título, descrição, solicitante e
            # endereço de todos os chamados da prefeitura).
            #
            # `visiveis=1` continua aceito e é redundante: o front ainda o envia.
            qs = qs.filter(self._cond_visivel(user))

        status_p = params.get('status')
        if status_p is not None and status_p != '':
            qs = qs.filter(status_chamado=status_p)
        return qs

    def perform_create(self, serializer):
        user = self._audit_user()
        unidade = serializer.validated_data.get('unidade')
        pode_escolher = _eh_dit(user) or user.secretarias_chefiadas.exists() or user.subordinados.exists()

        # A TI pode abrir em nome de outro servidor: o chamado passa a ser DELE
        # (aparece nos "meus chamados" dele), enquanto created_by continua
        # registrando quem digitou.
        solicitante_escolhido = serializer.validated_data.get('solicitante')
        if solicitante_escolhido and not _eh_dit(user):
            raise PermissionDenied('Só a equipe de TI pode abrir chamado em nome de outra pessoa.')


        if solicitante_escolhido and unidade is None:
            # herda o local do próprio solicitante: unidade dele, ou a unidade
            # da divisão dele. Se ele não tiver nem uma nem outra, quem abre
            # precisa informar a unidade na mão.
            unidade = (
                Unidade.objects.filter(id=solicitante_escolhido.unidade_id).first()
                or Unidade.objects.filter(divisao_id=solicitante_escolhido.divisao_id)
                .order_by('id').first()
            )
            if unidade is None:
                raise ValidationError({
                    'unidade_id': 'Este servidor não tem unidade nem setor cadastrado - informe a unidade do chamado.'
                })

        if not pode_escolher:
            # servidor comum: chamado vai pro próprio setor, sem escolha
            if not user.divisao_id:
                # sem setor não abre chamado — precisa pedir vínculo no perfil
                raise ValidationError({
                    'detail': 'Você ainda não está vinculado a um setor. '
                              'Solicite a entrada no seu setor pelo seu perfil antes de abrir chamados.'
                })
            if unidade is not None and unidade.divisao_id != user.divisao_id:
                raise ValidationError({'unidade_id': 'Você só pode abrir chamados para o seu setor.'})
            if unidade is None:
                unidade = (
                    Unidade.objects.filter(id=user.unidade_id).first()
                    or Unidade.objects.filter(divisao_id=user.divisao_id).order_by('id').first()
                )
                if unidade is None:
                    raise ValidationError({'unidade_id': 'Seu setor não tem unidade cadastrada — informe a unidade.'})
        elif unidade is None:
            raise ValidationError({'unidade_id': 'Informe a unidade do chamado.'})

        # de quem é o chamado: o servidor escolhido pela TI, ou quem está logado
        dono = solicitante_escolhido if (solicitante_escolhido and _eh_dit(user)) else user

        # Nenhum chamado fica no nome de alguém da TI.
        #
        # A checagem é sobre o DONO final, não sobre o campo enviado: validar só
        # `solicitante_id` deixaria o atalho de não escolher ninguém e o chamado
        # cair no nome de quem digitou — que é exatamente o comodismo a evitar.
        #
        # A exceção é quem NÃO TEM CONTA (terceirizado, visitante, estagiário
        # sem login): aí o chamado fica no registro de quem digitou, mas o nome
        # de quem pediu vai em `nome_solicitante`. O solicitante está
        # identificado — que é o que a regra exige —, só não tem cadastro.
        nome_informado = (serializer.validated_data.get('nome_solicitante') or '').strip()
        identificou_sem_conta = bool(nome_informado) and _eh_dit(user) and not solicitante_escolhido

        if eh_da_ti(dono) and not identificou_sem_conta:
            campo = 'solicitante_id' if solicitante_escolhido else 'detail'
            raise ValidationError({campo: (
                'O chamado não pode ficar no nome de alguém da TI — identifique '
                'o servidor que pediu o atendimento.'
            )})

        # nome exibido: o do dono; texto livre só quando a TI digita um nome
        # avulso (ligação de alguém que não tem conta no sistema)
        if solicitante_escolhido:
            nome = dono.nome_completo or dono.username
        elif _eh_dit(user) and nome_informado:
            nome = nome_informado
        else:
            nome = user.nome_completo or user.username

        extras = {
            'solicitante': dono,
            'nome_solicitante': nome,
            'unidade': unidade,
        }
        # Urgência é prerrogativa da TI: quem não é da TI não escolhe.
        if not _eh_dit(user):
            extras['urgencia'] = 0
            extras['status_chamado'] = Chamado.ABERTO
        elif serializer.validated_data.get('urgencia', 0) > 0:
            # a TI subiu a urgência já na abertura: é decisão de gente.
            # Deixar no Baixa padrão não conta como decisão - senão o
            # escalonamento nunca rodaria pros chamados abertos pela própria TI.
            extras['urgencia_manual'] = True

        # Chamado de secretário nasce Alta, venha por onde vier (inclusive
        # quando a TI abre em nome dele). Fica SEM `urgencia_manual`: é piso de
        # entrada, não decisão travada - o despachante ainda pode reavaliar.
        if dono.secretarias_chefiadas.exists():
            atual = extras.get('urgencia', serializer.validated_data.get('urgencia', 0))
            extras['urgencia'] = max(atual, urgencia_de_abertura(eh_secretario=True))

        serializer.save(created_by=user, updated_by=user, **extras)

    # ---- atendimento pelo técnico ----
    @staticmethod
    def _tecnico_ou_erro(user):
        tecnico = getattr(user, 'tecnico', None)
        if tecnico is None:
            raise ValidationError({'detail': 'Só técnicos cadastrados podem assumir um chamado.'})
        if eh_aprendiz(user):
            # cargo supervisionado acompanha o atendimento pela equipe, mas não
            # é ele quem assume o chamado
            raise PermissionDenied(
                'Seu perfil acompanha o atendimento pela equipe — quem assume o '
                'chamado é o técnico responsável.'
            )
        return tecnico

    @staticmethod
    def _equipe_no_chamado(chamado):
        """Equipe que está atendendo este chamado agora (se houver)."""
        return chamado.equipes_atendendo_agora.filter(encerrada_em__isnull=True).first()

    def _encerra_atendimento(self, equipe, novo_status, user, observacoes='', motivo=None):
        """
        Fecha o atendimento aberto da equipe e deixa o chamado no status
        escolhido. Encerrar o próprio atendimento NÃO é o mesmo que resolver o
        chamado: o técnico pode largar como "Em andamento" porque a parte dele
        acabou mas a de uma terceirizada continua.
        """
        from equipeTecnica.models import Atendimento  # noqa: F401

        agora = timezone.now()
        aberto = equipe.atendimentos.filter(encerrado_em__isnull=True).first()
        if aberto:
            aberto.encerrado_em = agora
            # resolvido de fato vs. entregue pra outro seguir. `motivo` explícito
            # existe pro cancelamento, que não é nenhum dos dois.
            aberto.motivo_encerramento = (
                motivo if motivo is not None
                else (0 if novo_status == Chamado.FINALIZADO else 1)
            )
            aberto.observacoes = observacoes or ''
            aberto.save()

            alvo = aberto.chamado
            if novo_status is not None and alvo.status_chamado != novo_status:
                alvo.status_chamado = novo_status
                if novo_status in Chamado.STATUS_ENCERRADOS:
                    alvo.finalizado_em = agora
                alvo.updated_by = user
                alvo.save(update_fields=['status_chamado', 'finalizado_em', 'updated_by', 'updated_at'])

        equipe.chamado_atual = None
        equipe.updated_by = user
        equipe.save(update_fields=['chamado_atual', 'updated_by', 'updated_at'])

    @staticmethod
    def _valida_status_pedido(valor, campo):
        if valor is None:
            return None
        try:
            valor = int(valor)
        except (TypeError, ValueError):
            raise ValidationError({campo: 'Status inválido.'})
        if valor not in dict(Chamado.STATUS_CHAMADO_CHOICES):
            raise ValidationError({campo: 'Status inválido.'})
        return valor

    @action(detail=True, methods=['post'])
    def atender(self, request, pk=None):
        """
        "Ir para o chamado": o técnico assume o atendimento agora.

        - um chamado é atendido por uma equipe de cada vez;
        - todo atendimento deixa rastro, então a equipe é criada sozinha se ele
          ainda não estiver em uma;
        - se ele já estiver em outro chamado, precisa dizer em que status vai
          deixá-lo (o front confirma isso num modal antes de chamar aqui).
        """
        from equipeTecnica.models import Equipe, Atendimento, ParticipacaoEquipe

        chamado = self.get_object()
        user = self._audit_user()
        tecnico = self._tecnico_ou_erro(user)

        if chamado.status_chamado in Chamado.STATUS_ENCERRADOS:
            raise ValidationError({'detail': 'Este chamado já foi encerrado.'})

        # já tem alguém atendendo? só quem está nela AGORA pode seguir - quem
        # já saiu da equipe continua no histórico, mas não manda mais nela
        ocupada = self._equipe_no_chamado(chamado)
        if ocupada and not ocupada.participacoes_abertas.filter(tecnico=tecnico).exists():
            nomes = ', '.join(
                (t.usuario.nome_completo or t.usuario.username)
                for t in ocupada.tecnicos_ativos.select_related('usuario')
            )
            raise ValidationError({
                'detail': f'Este chamado já está em atendimento por {nomes or "outra equipe"}.'
            })

        participacao = ParticipacaoEquipe.objects.filter(
            tecnico=tecnico, saiu_em__isnull=True, equipe__encerrada_em__isnull=True,
        ).select_related('equipe').first()
        equipe = participacao.equipe if participacao else None

        if equipe is None:
            equipe = Equipe.objects.create(created_by=user, updated_by=user)
            ParticipacaoEquipe.objects.create(
                equipe=equipe, tecnico=tecnico, created_by=user, updated_by=user,
            )
        elif equipe.chamado_atual_id and equipe.chamado_atual_id != chamado.id:
            # troca de chamado: exige decisão sobre o que fica pra trás
            status_anterior = self._valida_status_pedido(
                request.data.get('status_anterior'), 'status_anterior'
            )
            if status_anterior is None:
                atual = equipe.chamado_atual
                raise ValidationError({
                    'status_anterior': 'Informe em que status o chamado atual deve ficar.',
                    'chamado_atual': {'id': atual.id, 'titulo': atual.titulo},
                })
            self._encerra_atendimento(
                equipe, status_anterior, user, request.data.get('observacoes', '')
            )

        equipe.chamado_atual = chamado
        equipe.updated_by = user
        equipe.save(update_fields=['chamado_atual', 'updated_by', 'updated_at'])

        if not equipe.atendimentos.filter(chamado=chamado, encerrado_em__isnull=True).exists():
            Atendimento.objects.create(equipe=equipe, chamado=chamado)

        if chamado.status_chamado == Chamado.ABERTO:
            chamado.status_chamado = Chamado.EM_ANDAMENTO
            chamado.updated_by = user
            chamado.save(update_fields=['status_chamado', 'updated_by', 'updated_at'])

        return Response(self.get_serializer(chamado).data)

    @action(detail=True, methods=['post'], url_path='encerrar-atendimento')
    def encerrar_atendimento(self, request, pk=None):
        """
        O técnico sai do chamado, dizendo em que status ele fica.

        Sair não implica resolver: dá pra encerrar a parte da TI e deixar o
        chamado "Em andamento" porque uma terceirizada ainda vai atuar.
        """
        chamado = self.get_object()
        user = self._audit_user()
        tecnico = self._tecnico_ou_erro(user)

        equipe = self._equipe_no_chamado(chamado)
        if equipe is None or not equipe.participacoes_abertas.filter(tecnico=tecnico).exists():
            raise ValidationError({'detail': 'Você não está atendendo este chamado.'})

        novo_status = self._valida_status_pedido(request.data.get('status'), 'status')
        if novo_status is None:
            raise ValidationError({'status': 'Informe em que status o chamado deve ficar.'})

        self._encerra_atendimento(equipe, novo_status, user, request.data.get('observacoes', ''))
        return Response(self.get_serializer(chamado).data)

    def perform_update(self, serializer):
        """
        DIT manda em tudo. Solicitante só mexe no que ELE abriu e só enquanto
        o chamado está Aberto: pode corrigir título/descrição ou cancelar.
        Depois que a DIT assume (Em andamento), só a DIT altera.
        """
        user = self._audit_user()
        chamado = serializer.instance
        dados = serializer.validated_data

        if not _eh_dit(user):
            if chamado.solicitante_id != user.id:
                raise PermissionDenied('Você só pode alterar chamados que abriu.')

            if 'urgencia' in dados and dados['urgencia'] != chamado.urgencia:
                raise PermissionDenied('A prioridade é definida pela DIT.')
            if 'unidade' in dados and dados['unidade'] != chamado.unidade:
                raise PermissionDenied('Não é possível trocar a unidade do chamado.')

            if chamado.status_chamado != Chamado.ABERTO:
                raise PermissionDenied(
                    'Este chamado já está em atendimento — fale com a DIT para alterá-lo.'
                )

            novo_status = dados.get('status_chamado', chamado.status_chamado)
            if novo_status not in (Chamado.ABERTO, Chamado.CANCELADO):
                raise PermissionDenied(
                    'Você pode cancelar o chamado, mas só a DIT finaliza um atendimento.'
                )

        extras = {}
        # Despachante mexeu na urgência: congela o escalonamento automático.
        # Basta o campo vir no payload - a tela só o envia quando alguém usou o
        # seletor. Vale inclusive pra rebaixar: dizer "isto é baixa" é decisão.
        if 'urgencia' in dados:
            extras['urgencia_manual'] = True

        # guardado ANTES do save: depois dele a instância já está atualizada e
        # não dá mais pra saber se o status mudou nesta requisição
        status_anterior = chamado.status_chamado
        novo_status = dados.get('status_chamado', chamado.status_chamado)
        # carimba/limpa a data de encerramento conforme o status final
        if novo_status in Chamado.STATUS_ENCERRADOS:
            if chamado.finalizado_em is None:
                extras['finalizado_em'] = timezone.now()
        elif chamado.finalizado_em is not None:
            extras['finalizado_em'] = None

        serializer.save(updated_by=user, **extras)

        # Encerrar o chamado tem que encerrar o atendimento junto.
        #
        # Sem isto, o status virava "Finalizado" mas a equipe continuava com
        # `chamado_atual` apontando pra ele e o Atendimento seguia aberto: na
        # tela do técnico o chamado nunca saía, a equipe não voltava a ficar
        # livre e as horas de atendimento cresciam para sempre.
        if novo_status in Chamado.STATUS_ENCERRADOS and status_anterior != novo_status:
            equipe = self._equipe_no_chamado(chamado)
            if equipe:
                self._encerra_atendimento(
                    equipe, novo_status, user,
                    # 0 = Resolvido, 3 = Cancelado (Atendimento.MOTIVO_*)
                    motivo=0 if novo_status == Chamado.FINALIZADO else 3,
                )

    def perform_destroy(self, instance):
        # ninguém apaga chamado: solicitante cancela, DIT arquiva pelo admin
        if not _eh_dit(self._audit_user()):
            raise PermissionDenied('Chamados não podem ser excluídos — cancele o chamado.')
        instance.delete()
