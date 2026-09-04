from rest_framework import serializers
from unidade.models import Unidade
from usuario.models import Usuario
from .models import Chamado
from .prioridade import dias_em_aberto, dias_para_subir, urgencia_efetiva


class ChamadoSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_chamado_display', read_only=True)
    urgencia_display = serializers.CharField(source='get_urgencia_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_chamado_display', read_only=True)
    unidade_nome = serializers.CharField(source='unidade.nome', read_only=True)
    # opcional: quando não vem, a view resolve pro setor do solicitante
    unidade_id = serializers.PrimaryKeyRelatedField(
        queryset=Unidade.objects.all(), source='unidade', write_only=True, required=False,
    )
    # divisão/secretaria do chamado (derivadas da unidade) pro agrupamento no front
    divisao_id = serializers.IntegerField(source='unidade.divisao_id', read_only=True)
    # id do Endereco: o front usa pra centralizar o mapa de Localidades neste
    # ponto (link "Externo · local" do chamado)
    endereco_id = serializers.IntegerField(source='unidade.endereco_id', read_only=True)
    divisao_nome = serializers.CharField(source='unidade.divisao.nome', read_only=True)
    secretaria_sigla = serializers.CharField(source='unidade.divisao.secretaria.sigla', read_only=True)
    # solicitante vem do usuário logado (view); só a TI pode abrir em nome de
    # outra pessoa, informando solicitante_id
    solicitante_nome = serializers.CharField(source='solicitante.nome_completo', read_only=True)
    solicitante_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(), source='solicitante',
        write_only=True, required=False,
    )

    # endereço + coordenadas (mapa da DIT)
    endereco = serializers.SerializerMethodField()
    interno = serializers.SerializerMethodField()
    latitude = serializers.DecimalField(
        source='unidade.endereco.latitude', max_digits=9, decimal_places=6, read_only=True,
    )
    longitude = serializers.DecimalField(
        source='unidade.endereco.longitude', max_digits=9, decimal_places=6, read_only=True,
    )
    # Urgência que a tela usa: a gravada, elevada pelo tempo parado quando
    # ninguém definiu na mão. `urgencia` continua sendo o valor cru do banco.
    urgencia_efetiva = serializers.SerializerMethodField()
    urgencia_escalonada = serializers.SerializerMethodField()
    dias_em_aberto = serializers.SerializerMethodField()
    dias_para_subir = serializers.SerializerMethodField()

    # equipe que está atendendo agora (se houver)
    equipe_atual = serializers.SerializerMethodField()
    # delegações a empresas terceirizadas
    terceirizadas = serializers.SerializerMethodField()
    # histórico de atendimentos — inclui o comentário que o técnico deixa ao
    # encerrar (Atendimento.observacoes), que antes ficava invisível pra DIT
    atendimentos = serializers.SerializerMethodField()

    class Meta:
        model = Chamado
        fields = [
            'id', 'titulo', 'descricao',
            'tipo_chamado', 'tipo_display',
            'urgencia', 'urgencia_display', 'urgencia_manual',
            'urgencia_efetiva', 'urgencia_escalonada',
            'dias_em_aberto', 'dias_para_subir',
            'status_chamado', 'status_display',
            'unidade_id', 'unidade', 'unidade_nome',
            'divisao_id', 'divisao_nome', 'secretaria_sigla',
            'endereco', 'endereco_id', 'interno', 'latitude', 'longitude',
            'equipe_atual', 'terceirizadas', 'atendimentos',
            'solicitante', 'solicitante_id', 'solicitante_nome', 'nome_solicitante',
            'finalizado_em', 'created_at', 'updated_at',
        ]
        # nome_solicitante é escrevível só pra DIT (abrir em nome de terceiro);
        # a view ignora o valor quando quem abre não é da DIT.
        read_only_fields = ['unidade', 'solicitante', 'finalizado_em']
        extra_kwargs = {
            'nome_solicitante': {'required': False},
            # o título é só um rótulo: quem abre (solicitante ou despachante)
            # precisa explicar o chamado, senão quem atende sai a campo às cegas
            'descricao': {
                'required': True,
                'allow_blank': False,
                'error_messages': {
                    'required': 'Explique o que está acontecendo no chamado.',
                    'blank': 'Explique o que está acontecendo no chamado.',
                },
            },
        }

    def get_urgencia_efetiva(self, obj):
        return urgencia_efetiva(obj)[0]

    def get_urgencia_escalonada(self, obj):
        return urgencia_efetiva(obj)[1]

    def get_dias_em_aberto(self, obj):
        return dias_em_aberto(obj)

    def get_dias_para_subir(self, obj):
        return dias_para_subir(obj)

    def get_interno(self, obj):
        """
        Atendimento dentro do Paço, onde a própria SMIT fica: não há
        deslocamento, então traçar rota não faz sentido.
        """
        return bool(getattr(obj.unidade, 'paco_municipal', False))

    def get_endereco(self, obj):
        e = getattr(obj.unidade, 'endereco', None)
        if not e:
            return None
        bairro = e.bairro.nome if e.bairro_id else ''
        return f"{e.rua}, {e.numero or 's/n'}{f' - {bairro}' if bairro else ''}"

    def get_equipe_atual(self, obj):
        equipe = obj.equipes_atendendo_agora.filter(encerrada_em__isnull=True).first()
        if not equipe:
            return None
        return {
            'id': equipe.id,
            'tecnicos': [
                {
                    'id': t.id,
                    'nome': (t.usuario.nome_completo or t.usuario.username),
                }
                # quem está atendendo agora, não quem já passou pela equipe
                for t in equipe.tecnicos_ativos.select_related('usuario')
            ],
            'automovel': (
                f'{equipe.automovel_utilizado.marca} {equipe.automovel_utilizado.modelo}'
                if equipe.automovel_utilizado_id else None
            ),
            'placa': equipe.automovel_utilizado.placa if equipe.automovel_utilizado_id else None,
        }

    def get_atendimentos(self, obj):
        """
        Cada passagem de equipe pelo chamado, da mais recente pra mais antiga.

        `observacoes` é o que o técnico escreveu ao encerrar — vazio quando ele
        não comentou. A tela decide o que exibir; aqui vai tudo, porque o
        histórico sem os comentários já era um buraco.
        """
        resultado = []
        for a in obj.atendimentos.all():
            equipe = a.equipe
            resultado.append({
                'id': a.id,
                'iniciado_em': a.iniciado_em,
                'encerrado_em': a.encerrado_em,
                'motivo': a.motivo_encerramento,
                'motivo_display': (
                    a.get_motivo_encerramento_display()
                    if a.motivo_encerramento is not None else None
                ),
                'observacoes': a.observacoes or '',
                # quem passou pela equipe naquele atendimento
                'tecnicos': [
                    (p.tecnico.usuario.nome_completo or p.tecnico.usuario.username)
                    for p in equipe.participacoes.all()
                ],
            })
        resultado.sort(key=lambda x: x['iniciado_em'] or '', reverse=True)
        return resultado

    def get_terceirizadas(self, obj):
        return [
            {
                'id': d.id,
                'empresa': d.empresa_responsavel.nome,
                'protocolo': d.protocolo,
                'status': d.status_chamado,
                'status_display': d.get_status_chamado_display(),
                'finalizado_em': d.finalizado_em,
            }
            for d in obj.delegacoes.all()
        ]
