from rest_framework import serializers
from .models import (
    Bairro, Endereco, Secretaria, Divisao, Unidade,
    TelefoneUnidade, EmailUnidade, ResponsavelUnidade,
    Predio, PlantaAndar, Sala,
)


class BairroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bairro
        fields = ['id', 'nome', 'rural', 'created_at', 'updated_at']


class EnderecoSerializer(serializers.ModelSerializer):
    bairro = BairroSerializer(read_only=True)
    bairro_id = serializers.PrimaryKeyRelatedField(
        queryset=Bairro.objects.all(), source='bairro', write_only=True
    )

    class Meta:
        model = Endereco
        fields = [
            'id', 'rua', 'numero', 'cep', 'ponto_referencia',
            'latitude', 'longitude',
            'bairro', 'bairro_id',
            'created_at', 'updated_at',
        ]


class SecretariaSerializer(serializers.ModelSerializer):
    secretario_nome = serializers.SerializerMethodField()
    qtd_divisoes = serializers.IntegerField(source='divisoes.count', read_only=True)

    class Meta:
        model = Secretaria
        fields = [
            'id', 'nome', 'sigla', 'cor',
            'secretario_responsavel', 'secretario_nome', 'qtd_divisoes',
            'created_at', 'updated_at',
        ]

    def get_secretario_nome(self, obj):
        u = obj.secretario_responsavel
        return (u.nome_completo or u.username) if u else None


class DivisaoSerializer(serializers.ModelSerializer):
    secretaria = SecretariaSerializer(read_only=True)
    secretaria_id = serializers.PrimaryKeyRelatedField(
        queryset=Secretaria.objects.all(), source='secretaria', write_only=True
    )

    class Meta:
        model = Divisao
        fields = [
            'id', 'nome', 'sigla',
            'secretaria', 'secretaria_id',
            'created_at', 'updated_at',
        ]


class TelefoneUnidadeSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = TelefoneUnidade
        fields = ['id', 'numero', 'ramal', 'tipo', 'tipo_display', 'label']


class EmailUnidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailUnidade
        fields = ['id', 'endereco', 'principal']


class ResponsavelUnidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResponsavelUnidade
        fields = ['id', 'nome', 'titular']


class UnidadeSerializer(serializers.ModelSerializer):
    endereco = EnderecoSerializer(read_only=True)
    endereco_id = serializers.PrimaryKeyRelatedField(
        queryset=Endereco.objects.all(), source='endereco', write_only=True
    )
    divisao = DivisaoSerializer(read_only=True)
    divisao_id = serializers.PrimaryKeyRelatedField(
        queryset=Divisao.objects.all(), source='divisao', write_only=True
    )
    telefones = TelefoneUnidadeSerializer(many=True, read_only=True)
    emails = EmailUnidadeSerializer(many=True, read_only=True)
    responsaveis = ResponsavelUnidadeSerializer(many=True, read_only=True)

    class Meta:
        model = Unidade
        fields = [
            'id', 'nome', 'paco_municipal', 'email',
            'endereco', 'endereco_id',
            'divisao',  'divisao_id',
            'responsavel',
            'telefones', 'emails', 'responsaveis',
            'created_at', 'updated_at',
        ]


# ===== Planta interna =====

class SalaSerializer(serializers.ModelSerializer):
    # Ocupante = Divisão. A secretaria (sigla/cor/nome) vem dela, pro hover/cor do front.
    divisao = serializers.SerializerMethodField()
    divisao_id = serializers.PrimaryKeyRelatedField(
        queryset=Divisao.objects.all(), source='divisao',
        write_only=True, required=False, allow_null=True,
    )

    class Meta:
        model = Sala
        fields = [
            'id', 'label', 'pontos',
            'divisao', 'divisao_id',
        ]

    def get_divisao(self, obj):
        d = obj.divisao
        if not d:
            return None
        sec = d.secretaria
        return {
            'id': d.id,
            'nome': d.nome,
            'sigla': d.sigla,
            'secretaria': {'sigla': sec.sigla, 'cor': sec.cor, 'nome': sec.nome} if sec else None,
        }


class PlantaAndarSerializer(serializers.ModelSerializer):
    imagem = serializers.SerializerMethodField()
    salas = SalaSerializer(many=True, read_only=True)

    class Meta:
        model = PlantaAndar
        fields = ['id', 'andar', 'nome', 'imagem', 'salas']

    def get_imagem(self, obj):
        if not obj.imagem:
            return None
        url = obj.imagem.url
        request = self.context.get('request')
        return request.build_absolute_uri(url) if request else url


class PredioSerializer(serializers.ModelSerializer):
    plantas = PlantaAndarSerializer(many=True, read_only=True)
    endereco = EnderecoSerializer(read_only=True)

    class Meta:
        model = Predio
        fields = ['id', 'nome', 'endereco', 'plantas']
