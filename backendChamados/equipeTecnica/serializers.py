from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from core.tempo import intervalo_do_dia, intervalo_do_mes
from usuario.models import Usuario
from .models import Tecnico, Equipe, Atendimento, ResponsabilidadeTecnico

# Paleta estável pro avatar do técnico (indexada pelo id)
CORES_AVATAR = ['#4f46e5', '#0891b2', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0d9488']


class TecnicoSerializer(serializers.ModelSerializer):
    """
    Shape consumido pela tela de Técnicos: dados do Usuario + especialidades +
    status derivado (onde ele está agora) + contadores de atendimento.
    """
    nome_completo = serializers.SerializerMethodField()
    primeiro_nome = serializers.SerializerMethodField()
    matricula = serializers.CharField(source='usuario.matricula', read_only=True)
    unidade = serializers.SerializerMethodField()
    chefe_imediato = serializers.SerializerMethodField()
    cor = serializers.SerializerMethodField()

    responsabilidades = serializers.SerializerMethodField()
    responsabilidades_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False,
    )
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(), source='usuario', write_only=True,
        # o OneToOne já garante no banco; sem isso o erro viria como 500
        validators=[UniqueValidator(
            queryset=Tecnico.objects.all(),
            message='Este servidor já está cadastrado como técnico.',
        )],
    )

    cargo_display = serializers.CharField(source='get_cargo_display', read_only=True)
    status = serializers.SerializerMethodField()
    contexto = serializers.SerializerMethodField()
    atendimentos_hoje = serializers.SerializerMethodField()
    atendimentos_mes = serializers.SerializerMethodField()
    horas_campo_mes = serializers.SerializerMethodField()

    class Meta:
        model = Tecnico
        fields = [
            'id', 'disponivel', 'cargo', 'cargo_display',
            'usuario', 'usuario_id',
            'nome_completo', 'primeiro_nome', 'matricula', 'unidade', 'chefe_imediato', 'cor',
            'responsabilidades', 'responsabilidades_ids',
            'status', 'contexto',
            'atendimentos_hoje', 'atendimentos_mes', 'horas_campo_mes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['usuario']

    # ---- dados vindos do Usuario ----
    def get_nome_completo(self, obj):
        u = obj.usuario
        return u.nome_completo or u.username

    def get_primeiro_nome(self, obj):
        return self.get_nome_completo(obj).split()[0]

    def get_unidade(self, obj):
        u = obj.usuario
        if u.unidade_id:
            return u.unidade.nome
        if u.divisao_id:
            return u.divisao.nome
        return None

    def get_chefe_imediato(self, obj):
        chefe = obj.usuario.chefe_imediato
        return (chefe.nome_completo or chefe.username) if chefe else None

    def get_cor(self, obj):
        return CORES_AVATAR[obj.id % len(CORES_AVATAR)]

    def get_responsabilidades(self, obj):
        return [r.responsabilidade for r in obj.responsabilidades_set.all()]

    # ---- estado atual ----
    def _equipe_ativa(self, obj):
        """
        Equipe em que o técnico está AGORA. `obj.equipes` hoje inclui equipes
        de que ele já saiu (é histórico), então o corte é pela participação
        ainda aberta.
        """
        p = (
            obj.participacoes
            .filter(saiu_em__isnull=True, equipe__encerrada_em__isnull=True)
            .select_related('equipe')
            .first()
        )
        return p.equipe if p else None

    def get_status(self, obj):
        # estar em qualquer equipe aberta já conta como em campo: não existe
        # meio-termo entre disponível e alocado
        if self._equipe_ativa(obj):
            return 'em_campo'
        return 'disponivel' if obj.disponivel else 'folga'

    def get_contexto(self, obj):
        equipe = self._equipe_ativa(obj)
        if not equipe:
            return None
        nomes = ' + '.join(
            (t.usuario.nome_completo or t.usuario.username).split()[0]
            for t in equipe.tecnicos_ativos.select_related('usuario')
        )
        # com chamado mostra qual; sem chamado, só quem está na equipe
        if equipe.chamado_atual_id:
            return {'tipo': 'equipe', 'label': f'{nomes} · #{equipe.chamado_atual_id}'}
        return {'tipo': 'equipe', 'label': nomes}

    # ---- contadores ----
    def _atendimentos(self, obj):
        """Só o que aconteceu enquanto ele estava na equipe (ver Atendimento.do_tecnico)."""
        return Atendimento.do_tecnico(obj.id)

    def get_atendimentos_hoje(self, obj):
        inicio, fim = intervalo_do_dia()
        return self._atendimentos(obj).filter(
            iniciado_em__gte=inicio, iniciado_em__lt=fim
        ).count()

    def get_atendimentos_mes(self, obj):
        inicio, fim = intervalo_do_mes()
        return self._atendimentos(obj).filter(
            iniciado_em__gte=inicio, iniciado_em__lt=fim
        ).count()

    def get_horas_campo_mes(self, obj):
        """
        Horas do técnico, não do atendimento: conta só a interseção entre o
        atendimento e o período dele na equipe. Quem entrou faltando 10min pro
        fim leva 10min, não as 3h inteiras.
        """
        inicio_mes, fim_mes = intervalo_do_mes()
        agora = timezone.now()
        total = timedelta()

        participacoes = obj.participacoes.select_related('equipe').all()
        for p in participacoes:
            saida = p.saiu_em or agora
            qs = Atendimento.objects.filter(
                equipe_id=p.equipe_id,
                iniciado_em__gte=inicio_mes, iniciado_em__lt=fim_mes,
            )
            for a in qs:
                fim = min(a.encerrado_em or agora, saida)
                inicio = max(a.iniciado_em, p.entrou_em)
                if fim > inicio:
                    total += fim - inicio
        return round(total.total_seconds() / 3600, 1)

    # ---- escrita ----
    def _salva_responsabilidades(self, tecnico, ids):
        tecnico.responsabilidades_set.all().delete()
        for r in dict.fromkeys(ids):  # remove duplicatas preservando ordem
            ResponsabilidadeTecnico.objects.create(tecnico=tecnico, responsabilidade=r)

    @transaction.atomic
    def create(self, validated_data):
        resps = validated_data.pop('responsabilidades_ids', [])
        tecnico = super().create(validated_data)
        self._salva_responsabilidades(tecnico, resps)
        return tecnico

    @transaction.atomic
    def update(self, instance, validated_data):
        resps = validated_data.pop('responsabilidades_ids', None)
        tecnico = super().update(instance, validated_data)
        if resps is not None:
            self._salva_responsabilidades(tecnico, resps)
        return tecnico


class EquipeSerializer(serializers.ModelSerializer):
    """
    Uma Equipe passa por 3 fases, todas derivadas dos próprios campos:
      lobby     -> encerrada_em nulo e sem chamado_atual (ainda montando)
      em campo  -> encerrada_em nulo e com chamado_atual (despachada)
      encerrada -> encerrada_em preenchido
    """
    fase = serializers.SerializerMethodField()
    tecnicos_nomes = serializers.SerializerMethodField()
    participacoes = serializers.SerializerMethodField()
    veiculo = serializers.SerializerMethodField()
    chamado = serializers.SerializerMethodField()
    atendimentos = serializers.SerializerMethodField()
    vagas = serializers.SerializerMethodField()

    class Meta:
        model = Equipe
        fields = [
            'id', 'fase', 'encerrada_em',
            'chamado_atual', 'chamado',
            'automovel_utilizado', 'veiculo', 'vagas',
            'tecnicos', 'tecnicos_nomes', 'participacoes',
            'atendimentos', 'created_at', 'updated_at',
        ]
        # o M2M agora passa por um through-model: quem entra/sai é pelas ações
        # /entrar/ e /sair/, não por escrita direta na lista
        read_only_fields = ['tecnicos']

    def get_fase(self, obj):
        if obj.encerrada_em:
            return 'encerrada'
        return 'em_campo' if obj.chamado_atual_id else 'lobby'

    def _dados_tecnico(self, t):
        return {
            'id': t.id,
            'nome': (t.usuario.nome_completo or t.usuario.username),
            'cargo': t.get_cargo_display(),
            'responsabilidades': [r.responsabilidade for r in t.responsabilidades_set.all()],
        }

    def get_tecnicos_nomes(self, obj):
        """Quem está na equipe agora — quem saiu vai em `participacoes`."""
        return [
            self._dados_tecnico(p.tecnico)
            for p in obj.participacoes.all() if p.saiu_em is None
        ]

    def get_participacoes(self, obj):
        """Entradas e saídas, inclusive de quem já saiu (é o histórico da equipe)."""
        return [
            {
                **self._dados_tecnico(p.tecnico),
                'entrou_em': p.entrou_em,
                'saiu_em': p.saiu_em,
            }
            for p in obj.participacoes.all()
        ]

    def get_veiculo(self, obj):
        v = obj.automovel_utilizado
        if not v:
            return None
        return {
            'id': v.id, 'placa': v.placa,
            'modelo': f'{v.marca} {v.modelo}',
            'assentos': v.assentos,
        }

    def get_vagas(self, obj):
        """Assentos livres no carro (None quando ainda não há veículo)."""
        v = obj.automovel_utilizado
        if not v or not v.assentos:
            return None
        dentro = sum(1 for p in obj.participacoes.all() if p.saiu_em is None)
        return max(v.assentos - dentro, 0)

    def get_chamado(self, obj):
        c = obj.chamado_atual
        if not c:
            return None
        unidade = c.unidade
        return {
            'id': c.id, 'titulo': c.titulo,
            'endereco': getattr(getattr(unidade, 'endereco', None), 'rua', None),
            'urgencia': c.urgencia,
            'unidade_nome': getattr(unidade, 'nome', None),
            # interno = chamado dentro do Paço, onde a própria SMIT fica: a equipe
            # resolve sem deslocamento. Externo exige ir até a unidade.
            'interno': bool(getattr(unidade, 'paco_municipal', False)),
        }

    def get_atendimentos(self, obj):
        return [
            {
                'id': a.id,
                'chamado_id': a.chamado_id,
                'titulo': a.chamado.titulo,
                'iniciado_em': a.iniciado_em,
                'encerrado_em': a.encerrado_em,
                'motivo_encerramento': a.motivo_encerramento,
            }
            for a in obj.atendimentos.all()
        ]


class AtendimentoSerializer(serializers.ModelSerializer):
    motivo_display = serializers.CharField(source='get_motivo_encerramento_display', read_only=True)
    chamado_titulo = serializers.CharField(source='chamado.titulo', read_only=True)
    # primeiros nomes de quem atendeu junto (pro histórico do técnico)
    parceiros = serializers.SerializerMethodField()

    class Meta:
        model = Atendimento
        fields = [
            'id', 'equipe', 'chamado', 'chamado_titulo', 'parceiros',
            'iniciado_em', 'encerrado_em', 'observacoes',
            'motivo_encerramento', 'motivo_display',
            'created_at', 'updated_at',
        ]

    def get_parceiros(self, obj):
        """
        Quem estava na equipe DURANTE este atendimento — não quem está nela
        agora. Sem isso, quem saiu depois sumiria do registro.
        """
        fim = obj.encerrado_em or timezone.now()
        nomes = []
        for p in obj.equipe.participacoes.select_related('tecnico__usuario'):
            if p.entrou_em > fim:
                continue                      # entrou depois de acabar
            if p.saiu_em and p.saiu_em < obj.iniciado_em:
                continue                      # tinha saído antes de começar
            u = p.tecnico.usuario
            nomes.append((u.nome_completo or u.username).split()[0])
        return nomes
