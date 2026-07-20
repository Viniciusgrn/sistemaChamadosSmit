from rest_framework import serializers
from unidade.models import Unidade
from .models import Chamado


class ChamadoSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_chamado_display', read_only=True)
    urgencia_display = serializers.CharField(source='get_urgencia_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_chamado_display', read_only=True)
    unidade_nome = serializers.CharField(source='unidade.nome', read_only=True)
    # opcional: quando não vem, a view resolve pro setor do solicitante
    unidade_id = serializers.PrimaryKeyRelatedField(
        queryset=Unidade.objects.all(), source='unidade', write_only=True, required=False,
    )
    # divisão/secretaria do chamado (derivadas da unidade) pro agrupamento no front
    divisao_id = serializers.IntegerField(source='unidade.divisao_id', read_only=True)
    divisao_nome = serializers.CharField(source='unidade.divisao.nome', read_only=True)
    secretaria_sigla = serializers.CharField(source='unidade.divisao.secretaria.sigla', read_only=True)
    # solicitante vem do usuário logado (view), nunca do body
    solicitante_nome = serializers.CharField(source='solicitante.nome_completo', read_only=True)

    class Meta:
        model = Chamado
        fields = [
            'id', 'titulo', 'descricao',
            'tipo_chamado', 'tipo_display',
            'urgencia', 'urgencia_display',
            'status_chamado', 'status_display',
            'unidade_id', 'unidade', 'unidade_nome',
            'divisao_id', 'divisao_nome', 'secretaria_sigla',
            'solicitante', 'solicitante_nome', 'nome_solicitante',
            'finalizado_em', 'created_at', 'updated_at',
        ]
        read_only_fields = ['unidade', 'solicitante', 'nome_solicitante', 'finalizado_em']
