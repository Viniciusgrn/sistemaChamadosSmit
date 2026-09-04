from rest_framework import serializers

from .models import Documento

LIMITE_MB = 20


class DocumentoSerializer(serializers.ModelSerializer):
    tamanho = serializers.SerializerMethodField()
    enviado_por = serializers.SerializerMethodField()
    # write_only: a URL direta do arquivo não serve pra nada (o nginx bloqueia
    # /media/protegido/) e devolvê-la só confundiria — o caminho é o download
    arquivo = serializers.FileField(write_only=True)

    class Meta:
        model = Documento
        fields = ['id', 'nome', 'arquivo', 'tamanho', 'enviado_por', 'created_at']

    def get_tamanho(self, obj):
        try:
            return obj.arquivo.size
        except (FileNotFoundError, ValueError):
            # arquivo sumiu do disco (volume trocado, restore parcial):
            # a linha continua listável e o erro aparece só no download
            return None

    def get_enviado_por(self, obj):
        return obj.created_by.nome_completo if obj.created_by else None

    def validate_arquivo(self, arquivo):
        if arquivo.size > LIMITE_MB * 1024 * 1024:
            raise serializers.ValidationError(f'Arquivo maior que {LIMITE_MB} MB.')

        # extensão E assinatura: content_type vem do navegador e é forjável;
        # todo PDF de verdade começa com os bytes "%PDF"
        if not (arquivo.name or '').lower().endswith('.pdf'):
            raise serializers.ValidationError('Só arquivos PDF são aceitos.')
        inicio = arquivo.read(4)
        arquivo.seek(0)
        if inicio != b'%PDF':
            raise serializers.ValidationError('O arquivo não é um PDF válido.')

        return arquivo
