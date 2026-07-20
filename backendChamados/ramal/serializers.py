from rest_framework import serializers
from .models import Ramal


class RamalSerializer(serializers.ModelSerializer):
    vago = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ramal
        fields = [
            'id', 'numero', 'setor', 'ocupante', 'vago',
            'divisao', 'created_at', 'updated_at',
        ]
