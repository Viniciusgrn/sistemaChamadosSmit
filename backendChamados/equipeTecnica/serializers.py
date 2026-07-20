from rest_framework import serializers
from .models import Tecnico, Equipe, Atendimento

class TecnicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tecnico
        fields = '__all__'

class EquipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipe
        fields = '__all__'

    def alocarTecnico():
        tecnico = Tecnico.get_deferred_fields(self=id)
        equipe = Equipe.get_deferred_fields(self=id)
        
        

class AtendimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atendimento
        fields = '__all__'