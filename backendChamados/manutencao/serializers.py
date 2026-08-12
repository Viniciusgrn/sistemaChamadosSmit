from django.utils import timezone
from rest_framework import serializers

from equipamento.models import Equipamento
from .models import Manutencao

CORES_AVATAR = ['#4f46e5', '#0ea5e9', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0d9488']

class ManutencaoSerializer(serializers.ModelSerializer):
    """
    Ordem de manutenção de um equipamento.

    Regras aplicadas aqui:
      - finalizar (status 1) exige `servico_executado` preenchido;
      - computador (tipo 1) só finaliza com backup registrado;
      - concluir carimba `concluida_em`; reabrir limpa.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    destino_display = serializers.CharField(source='get_destino_equipamento_display', read_only=True)
    equipamento_info = serializers.SerializerMethodField()
    chamado_info = serializers.SerializerMethodField()
    tecnicos_info = serializers.SerializerMethodField()
    backup_feito_por_nome = serializers.SerializerMethodField()
    iniciada_em = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Manutencao
        fields = [
            'id', 'status', 'status_display',
            'diagnostico', 'servico_executado',
            'localizacao_atual_equipamento',
            'backup', 'backup_data', 'backup_feito_por', 'backup_feito_por_nome',
            'chamado', 'chamado_info',
            'equipamento', 'equipamento_info',
            'destino_equipamento', 'destino_display',
            'tecnicos', 'tecnicos_info',
            'iniciada_em', 'concluida_em',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['concluida_em']
        extra_kwargs = {'tecnicos': {'required': False, 'allow_empty': True}}

    # ---- leitura ----
    def get_equipamento_info(self, obj):
        e = obj.equipamento
        if not e:
            return None
        return {
            'id': e.id,
            'patrimonio': e.patrimonio,
            'marca': e.marca,
            'modelo': e.modelo_equipamento,
            'tipo': e.tipo_equipamento,
            'tipo_display': e.get_tipo_equipamento_display(),
            'unidade': e.unidade_atual.nome if e.unidade_atual_id else None,
        }

    def get_chamado_info(self, obj):
        c = obj.chamado
        if not c:
            return None
        return {'id': c.id, 'titulo': c.titulo, 'status': c.status_chamado}

    def get_tecnicos_info(self, obj):
        return [
            {
                'id': t.id,
                'nome_completo': (t.usuario.nome_completo or t.usuario.username),
                'primeiro_nome': (t.usuario.nome_completo or t.usuario.username).split()[0],
                'cor': CORES_AVATAR[t.id % len(CORES_AVATAR)],
            }
            for t in obj.tecnicos.all()
        ]

    def get_backup_feito_por_nome(self, obj):
        u = obj.backup_feito_por
        return (u.nome_completo or u.username) if u else None

    # ---- validação das regras ----
    def validate(self, dados):
        instancia = self.instance
        pegar = lambda campo, padrao=None: dados.get(  # noqa: E731
            campo, getattr(instancia, campo, padrao)
        )

        status = pegar('status', Manutencao.objects.model._meta.get_field('status').default)
        equipamento = pegar('equipamento')

        if status == 1:  # Finalizado
            if not (pegar('servico_executado') or '').strip():
                raise serializers.ValidationError({
                    'servico_executado': 'Descreva o serviço executado antes de finalizar.'
                })
            eh_computador = (
                equipamento is not None
                and getattr(equipamento, 'tipo_equipamento', None) == 1
            )
            if eh_computador and not pegar('backup'):
                raise serializers.ValidationError({
                    'backup': 'Computador só pode ser finalizado com o backup registrado.'
                })

        # encerrar (finalizado ou sem conserto) exige dizer pra onde o
        # equipamento vai - ele nem sempre volta pro uso
        if status in (1, 2) and pegar('destino_equipamento') is None:
            raise serializers.ValidationError({
                'destino_equipamento': 'Informe o destino do equipamento (em uso, estoque ou descarte).'
            })
        return dados

    # ---- escrita ----
    def _carimba_conclusao(self, instancia, status):
        if status in (1, 2):  # Finalizado ou Sem conserto
            if instancia.concluida_em is None:
                instancia.concluida_em = timezone.now()
                instancia.save(update_fields=['concluida_em'])
        elif instancia.concluida_em is not None:
            instancia.concluida_em = None
            instancia.save(update_fields=['concluida_em'])

    def _sincroniza_equipamento(self, instancia):
        """
        Ordem aberta  -> equipamento fica "Em manutenção".
        Ordem encerrada -> vai pro destino escolhido (uso/estoque/descarte).
        Nunca adivinha o destino: se não foi informado, não mexe no equipamento.
        """
        if not instancia.equipamento_id:
            return
        if instancia.status == 0:
            novo = 2  # Em manutenção
        elif instancia.destino_equipamento is not None:
            novo = instancia.destino_equipamento
        else:
            return
        Equipamento.objects.filter(id=instancia.equipamento_id).update(status=novo)

    def create(self, validated_data):
        instancia = super().create(validated_data)
        self._carimba_conclusao(instancia, instancia.status)
        self._sincroniza_equipamento(instancia)
        return instancia

    def update(self, instancia, validated_data):
        instancia = super().update(instancia, validated_data)
        self._carimba_conclusao(instancia, instancia.status)
        self._sincroniza_equipamento(instancia)
        return instancia
