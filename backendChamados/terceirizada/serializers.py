from rest_framework import serializers
from .models import EmpresaTerceirizada, ChamadoTerceirizada


class ChamadoTerceirizadaResumoSerializer(serializers.ModelSerializer):
    """Resumo de um chamado delegado, no shape que o drawer do front consome."""
    status = serializers.IntegerField(source='status_chamado', read_only=True)
    status_display = serializers.CharField(source='get_status_chamado_display', read_only=True)
    chamado_interno = serializers.SerializerMethodField()
    aberto_em = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = ChamadoTerceirizada
        fields = [
            'id', 'titulo', 'protocolo', 'status', 'status_display',
            'chamado_interno', 'aberto_em', 'finalizado_em',
        ]

    def get_chamado_interno(self, obj):
        return str(obj.chamado) if obj.chamado_id else None


class EmpresaTerceirizadaSerializer(serializers.ModelSerializer):
    responsabilidade_display = serializers.CharField(source='get_responsabilidade_display', read_only=True)
    chamados = ChamadoTerceirizadaResumoSerializer(many=True, read_only=True)
    qtd_total = serializers.SerializerMethodField()
    qtd_ativos = serializers.SerializerMethodField()

    class Meta:
        model = EmpresaTerceirizada
        fields = [
            'id', 'nome', 'numero_telefone', 'link_site',
            'responsabilidade', 'responsabilidade_display',
            'chamados', 'qtd_total', 'qtd_ativos',
            'created_at', 'updated_at',
        ]

    def get_qtd_total(self, obj):
        return obj.chamados.count()

    def get_qtd_ativos(self, obj):
        # Aberto(0) ou Em andamento(1)
        return sum(1 for c in obj.chamados.all() if c.status_chamado in (0, 1))


class ChamadoTerceirizadaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_chamado_display', read_only=True)
    empresa_nome = serializers.CharField(source='empresa_responsavel.nome', read_only=True)

    class Meta:
        model = ChamadoTerceirizada
        fields = [
            'id', 'titulo', 'descricao', 'protocolo',
            'status_chamado', 'status_display', 'finalizado_em',
            'chamado', 'empresa_responsavel', 'empresa_nome',
            'created_at', 'updated_at',
        ]
