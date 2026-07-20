from rest_framework import serializers
from unidade.models import Divisao
from .models import Usuario, SolicitacaoDivisao

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        exclude = ['groups', 'user_permissions'] 
        extra_kwargs = {
            'password': {'write_only': True} 
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class SolicitacaoDivisaoSerializer(serializers.ModelSerializer):
    usuario = serializers.SerializerMethodField()
    divisao = serializers.SerializerMethodField()
    divisao_id = serializers.PrimaryKeyRelatedField(
        queryset=Divisao.objects.all(), source='divisao', write_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    decidido_por_nome = serializers.CharField(source='decidido_por.nome_completo', read_only=True, default=None)

    class Meta:
        model = SolicitacaoDivisao
        fields = [
            'id', 'usuario', 'divisao', 'divisao_id',
            'status', 'status_display',
            'decidido_por_nome', 'decidido_em', 'created_at',
        ]
        read_only_fields = ['status', 'decidido_em']

    def get_usuario(self, obj):
        u = obj.usuario
        return {'id': u.id, 'username': u.username, 'nome_completo': u.nome_completo or u.username, 'email': u.email}

    def get_divisao(self, obj):
        d = obj.divisao
        return {'id': d.id, 'nome': d.nome, 'sigla': d.sigla, 'secretaria': d.secretaria.sigla}

