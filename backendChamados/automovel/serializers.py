from rest_framework import serializers
from django.utils import timezone
from .models import Automovel, AgendaAutomovel


class AgendaAutomovelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgendaAutomovel
        fields = [
            'id', 'data_agendamento', 'encerrado_em',
            'motivo', 'tipo_agendamento', 'automovel',
            'created_at', 'updated_at',
        ]


class AutomovelSerializer(serializers.ModelSerializer):
    cor_display = serializers.CharField(source='get_cor_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    agendamentos_futuros = serializers.SerializerMethodField()
    equipe_atual = serializers.SerializerMethodField()

    class Meta:
        model = Automovel
        fields = [
            'id', 'marca', 'modelo', 'placa', 'cor', 'cor_display',
            'status', 'status_display', 'assentos',
            'agendamentos_futuros', 'equipe_atual',
            'created_at', 'updated_at',
        ]

    def get_agendamentos_futuros(self, obj):
        agora = timezone.now()
        qs = obj.agendamentos.filter(
            encerrado_em__isnull=True,
            data_agendamento__gte=agora,
        ).order_by('data_agendamento')
        return AgendaAutomovelSerializer(qs, many=True).data

    def get_equipe_atual(self, obj):
        """
        Equipe usando o carro agora (Equipe ativa com automovel_utilizado=obj).
        Defensivo: enquanto equipeTecnica não tiver dados, retorna None.
        """
        try:
            from equipeTecnica.models import Equipe
        except Exception:
            return None

        equipe = (
            Equipe.objects
            .filter(automovel_utilizado=obj, encerrada_em__isnull=True)
            .prefetch_related('tecnicos__usuario')
            .select_related('chamado_atual')
            .first()
        )
        if not equipe:
            return None

        integrantes = []
        for t in equipe.tecnicos.all():
            nome = getattr(t.usuario, 'nome_completo', '') or getattr(t.usuario, 'username', '')
            integrantes.append(nome.split(' ')[0] if nome else 'Técnico')

        chamado = equipe.chamado_atual
        return {
            'equipe_id': equipe.id,
            'integrantes': integrantes,
            'chamado_codigo': f'CH-{chamado.id}' if chamado else None,
            'chamado_titulo': getattr(chamado, 'titulo', None) if chamado else None,
        }
