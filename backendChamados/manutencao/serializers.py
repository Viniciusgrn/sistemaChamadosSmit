from rest_framework import serializers
from .models import Manutencao

class ManutencaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manutencao
        fields = '__all__'
