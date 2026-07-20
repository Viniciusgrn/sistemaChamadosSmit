from rest_framework import serializers
from .models import Equipamento
from unidade.models import Unidade


class EquipamentoSerializer(serializers.ModelSerializer):
    # expõe nomes que o front usa (modelo/tipo) mapeando pros campos do model
    modelo = serializers.CharField(source='modelo_equipamento')
    tipo = serializers.IntegerField(source='tipo_equipamento')
    tipo_display = serializers.CharField(source='get_tipo_equipamento_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    unidade = serializers.SerializerMethodField()
    unidade_id = serializers.PrimaryKeyRelatedField(
        queryset=Unidade.objects.all(), source='unidade_atual',
        write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = Equipamento
        fields = [
            'id', 'patrimonio', 'numero_de_serie', 'marca', 'modelo',
            'tipo', 'tipo_display', 'status', 'status_display',
            'unidade', 'unidade_id',
            'created_at', 'updated_at',
        ]

    def get_unidade(self, obj):
        if obj.unidade_atual:
            return {'id': obj.unidade_atual.id, 'nome': obj.unidade_atual.nome}
        return None
