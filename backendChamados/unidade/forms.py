from django import forms

from .models import Sala
from .widgets import PolygonWidget


class SalaAdminForm(forms.ModelForm):
    class Meta:
        model = Sala
        fields = '__all__'
        widgets = {
            'pontos': PolygonWidget,
        }
