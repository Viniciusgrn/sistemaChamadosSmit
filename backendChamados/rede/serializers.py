from rest_framework import serializers

from .cifra import cifrar, decifrar
from .models import DispositivoRede, RedeWifi


class DispositivoRedeSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    unidade_nome = serializers.CharField(source='unidade.nome', read_only=True)
    equipamento_nome = serializers.CharField(source='equipamento.nome', read_only=True, default=None)
    # a senha viaja em claro na API (o técnico precisa dela pra trabalhar) e
    # cifrada no banco — a troca acontece aqui, e SÓ aqui
    senha_acesso = serializers.CharField(allow_blank=True, required=False, default='')

    class Meta:
        model = DispositivoRede
        fields = [
            'id', 'unidade', 'unidade_nome',
            'equipamento', 'equipamento_nome',
            'tipo', 'tipo_display', 'nome_na_rede', 'ip',
            'usuario_acesso', 'senha_acesso', 'observacoes',
            'created_at', 'updated_at',
        ]

    def to_representation(self, obj):
        dados = super().to_representation(obj)
        dados['senha_acesso'] = decifrar(obj.senha_acesso)
        return dados

    def validate_senha_acesso(self, valor):
        return cifrar(valor)


class RedeWifiSerializer(serializers.ModelSerializer):
    unidade_nome = serializers.CharField(source='unidade.nome', read_only=True)
    emitida_por_nome = serializers.CharField(source='emitida_por.nome_na_rede', read_only=True, default=None)
    senha = serializers.CharField(allow_blank=True, required=False, default='')

    class Meta:
        model = RedeWifi
        fields = [
            'id', 'unidade', 'unidade_nome',
            'ssid', 'senha', 'emitida_por', 'emitida_por_nome',
            'oculta', 'visitantes', 'observacoes',
            'created_at', 'updated_at',
        ]

    def to_representation(self, obj):
        dados = super().to_representation(obj)
        dados['senha'] = decifrar(obj.senha)
        return dados

    def validate_senha(self, valor):
        return cifrar(valor)

    def validate(self, dados):
        # o AP emissor tem que ser da MESMA unidade da rede — apontar pro
        # switch de outra escola é erro de digitação, não caso de uso
        emissor = dados.get('emitida_por')
        unidade = dados.get('unidade') or getattr(self.instance, 'unidade', None)
        if emissor and unidade and emissor.unidade_id != unidade.id:
            raise serializers.ValidationError({
                'emitida_por': 'Este dispositivo é de outra unidade.'
            })
        return dados
