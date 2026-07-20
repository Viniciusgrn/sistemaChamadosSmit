from django.db import models
from core.models import BaseModel


class Bairro(BaseModel):
    nome = models.CharField(max_length=255, unique=True)
    rural = models.BooleanField(default=False)

    def __str__(self):
        return self.nome


class Endereco(BaseModel):
    GEO_PRECISAO_CHOICES = [
        ('exato',  'Exato (rua/número)'),
        ('bairro', 'Aproximado (centro do bairro)'),
        ('centro', 'Genérico (centro da cidade)'),
        ('manual', 'Ajustado manualmente'),
    ]
    numero = models.CharField(max_length=20, blank=True, null=True)
    rua = models.CharField(max_length=255)
    cep = models.CharField(max_length=15, blank=True, null=True)
    ponto_referencia = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, default=0.0 ,decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, default=0.0 ,decimal_places=6, null=True, blank=True)
    geo_precisao = models.CharField(max_length=10, choices=GEO_PRECISAO_CHOICES, default='exato')
    bairro = models.ForeignKey(Bairro, on_delete=models.PROTECT, related_name='enderecos')

    def __str__(self):
        return f"{self.rua}, {self.numero or 's/n'}"


class Secretaria(BaseModel):
    nome = models.CharField(max_length=255, unique=True)
    sigla = models.CharField(max_length=10, unique=True)
    cor = models.CharField(max_length=7, default="#E3E728", help_text='Cor hex pra UI (ex: #dc2626)')
    secretario_responsavel = models.ForeignKey(
        'usuario.Usuario', on_delete=models.PROTECT,
        null=True, blank=True, related_name='secretarias_chefiadas'
    )

    def __str__(self):
        return self.sigla


class Divisao(BaseModel):
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=55, null=True)
    secretaria = models.ForeignKey(Secretaria, on_delete=models.PROTECT, related_name='divisoes')

    def __str__(self):
        return f"{self.secretaria.sigla} · {self.sigla}"


class Unidade(BaseModel):
    nome = models.CharField(max_length=150)
    paco_municipal = models.BooleanField(default=False)
    email = models.EmailField(blank=True,null=True)
    endereco = models.ForeignKey(Endereco, on_delete=models.PROTECT, related_name='unidades')
    responsavel = models.ForeignKey(
        'usuario.Usuario', on_delete=models.PROTECT,
        null=True, blank=True, related_name='unidades_gerenciadas'
    )
    divisao = models.ForeignKey(Divisao, on_delete=models.PROTECT, related_name='unidades')

    def __str__(self):
        return self.nome


class TelefoneUnidade(BaseModel):
    """Telefones de atendimento ao público da unidade (1 unidade : N telefones)."""
    TIPO_CHOICES = [
        (0, 'Fixo'),
        (1, 'Celular'),
        (2, 'WhatsApp'),
        (3, 'Emergência'),
    ]
    unidade = models.ForeignKey(Unidade, on_delete=models.CASCADE, related_name='telefones')
    numero  = models.CharField(max_length=40)
    ramal   = models.CharField(max_length=15, blank=True)
    tipo    = models.IntegerField(choices=TIPO_CHOICES, default=0)
    label   = models.CharField(max_length=60, blank=True, help_text='Ex: Plantão GCM, Adm')

    def __str__(self):
        return f"{self.numero}{' r.' + self.ramal if self.ramal else ''}"


class EmailUnidade(BaseModel):
    """E-mails da unidade (1 unidade : N e-mails)."""
    unidade   = models.ForeignKey(Unidade, on_delete=models.CASCADE, related_name='emails')
    endereco  = models.EmailField()
    principal = models.BooleanField(default=False)

    def __str__(self):
        return self.endereco


class ResponsavelUnidade(BaseModel):
    """
    Responsáveis nominais da unidade, como texto livre (vindo da base oficial).
    Distinto de Unidade.responsavel (FK Usuario) — aqui guardamos o nome mesmo
    sem o usuário existir no sistema. titular=False indica substituto.
    """
    unidade = models.ForeignKey(Unidade, on_delete=models.CASCADE, related_name='responsaveis')
    nome    = models.CharField(max_length=255)
    titular = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


# ============================================================
# Planta interna de prédios (ex: Paço Municipal)
# Predio -> N PlantaAndar (imagem por andar) -> N Sala (área clicável)
# Coordenadas das salas em PERCENTUAL (0-100) da imagem — independem da
# resolução, então o front pode escalar a planta livremente.
# ============================================================

class Predio(BaseModel):
    """Endereço que tem planta interna mapeada (poucos: Paço, hospital polo…)."""
    endereco = models.OneToOneField(Endereco, on_delete=models.PROTECT, related_name='predio')
    nome     = models.CharField(max_length=150)

    def __str__(self):
        return self.nome


class PlantaAndar(BaseModel):
    predio  = models.ForeignKey(Predio, on_delete=models.CASCADE, related_name='plantas')
    andar   = models.IntegerField(help_text='0=térreo, 1=superior, …')
    nome    = models.CharField(max_length=60, blank=True, help_text='Ex: Térreo, Superior')
    imagem  = models.ImageField(upload_to='plantas/')

    class Meta(BaseModel.Meta):
        constraints = [
            models.UniqueConstraint(fields=['predio', 'andar'], name='unique_andar_por_predio'),
        ]
        ordering = ['andar']

    def __str__(self):
        return f"{self.predio.nome} · {self.nome or f'andar {self.andar}'}"


class Sala(BaseModel):
    """
    Espaço físico fixo na planta. O ocupante é uma Divisão (de onde vem a
    secretaria + cor). `label` é opcional, só pra salas sem divisão definida
    (recepção, copa, auditório…). Quando muda o ocupante, troca-se a divisão —
    a posição da sala continua.
    """
    planta    = models.ForeignKey(PlantaAndar, on_delete=models.CASCADE, related_name='salas')
    divisao   = models.ForeignKey(
        Divisao, on_delete=models.SET_NULL, null=True, blank=True, related_name='salas'
    )
    label     = models.CharField(max_length=100, blank=True, help_text='Opcional — só pra salas sem divisão (recepção, copa…)')
    # Polígono da sala: lista de vértices [[x, y], …] em % da imagem (0-100).
    # Suporta qualquer formato (L, trapézio…), não só retângulos.
    pontos    = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.label or (self.divisao.nome if self.divisao else f'Sala {self.pk}')
