from django.db import models

from core.models import BaseModel


class Documento(BaseModel):
    """
    Guardador de documentos da TI: um nome e um PDF, pra baixar de qualquer
    lugar pelo sistema.

    O arquivo vai pra media/protegido/, que o nginx NÃO serve (default.conf
    devolve 404 ali). O único caminho até o PDF é a action `download` da API,
    que exige login de quem opera o sistema — /media/ solto no nginx é público
    e vazaria documento interno pra quem tivesse a URL.
    """
    nome = models.CharField(max_length=150)
    arquivo = models.FileField(upload_to='protegido/documentos/%Y/')

    class Meta(BaseModel.Meta):
        ordering = ['nome']

    def __str__(self):
        return self.nome
