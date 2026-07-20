import json

from django import forms

from .models import PlantaAndar


class PolygonWidget(forms.Textarea):
    """
    Editor visual de polígono pro campo `Sala.pontos`.

    Renderiza a imagem do andar selecionado (campo `planta`) e deixa o usuário
    clicar pra adicionar vértices, arrastar pra mover e dar duplo-clique pra
    remover. Guarda a lista [[x, y], …] em % (0-100) no textarea oculto.
    """
    template_name = 'unidade/polygon_widget.html'

    class Media:
        css = {'all': ('unidade/planta_editor.css',)}
        js = ('unidade/planta_editor.js',)

    def get_context(self, name, value, attrs):
        ctx = super().get_context(name, value, attrs)
        mapping = {}
        for p in PlantaAndar.objects.select_related('predio').all():
            if p.imagem:
                mapping[str(p.id)] = {'url': p.imagem.url, 'nome': str(p)}
        ctx['widget']['plantas_json'] = json.dumps(mapping)
        return ctx
