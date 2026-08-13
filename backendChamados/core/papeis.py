"""
Quem é quem no sistema.

Regra de negócio central: a TI da prefeitura era a DIT, uma divisão da
Secretaria de Governo. Hoje é secretaria própria - a SMIT. Manter isso em um
lugar só evita que a checagem apareça espalhada e desatualizada.
"""

# sigla da secretaria de TI (antes era a divisão 'DIT')
SIGLA_TI = 'SMIT'
# sigla antiga, aceita enquanto houver base sem a migração aplicada
SIGLA_TI_LEGADO = 'DIT'


def eh_da_ti(user):
    """Está lotado na secretaria de TI (ou na divisão de TI herdada)."""
    divisao = getattr(user, 'divisao', None)
    if not divisao:
        return False
    secretaria = getattr(divisao, 'secretaria', None)
    if secretaria and (secretaria.sigla or '').upper() == SIGLA_TI:
        return True
    return (divisao.sigla or '').upper() == SIGLA_TI_LEGADO


def eh_tecnico(user):
    """Tem cadastro de técnico (atende chamados em campo)."""
    return hasattr(user, 'tecnico')


def opera_sistema(user):
    """
    Vê o sistema completo em vez do portal do solicitante: superusuário,
    pessoal da TI e técnicos (que atendem chamados de qualquer secretaria,
    mesmo sem divisão preenchida).
    """
    return bool(user.is_superuser or eh_tecnico(user) or eh_da_ti(user))


# ---------------------------------------------------------------------------
# Perfis operacionais
#
# Nem todo técnico usa o sistema inteiro. Quem está em campo (e no celular)
# recebe uma versão enxuta; quem coordena continua com a completa.
# ---------------------------------------------------------------------------

# Tecnico.RESPONSABILIDADE_CHOICES
RESP_ADMINISTRATIVO = 3
# Tecnico.CARGO_CHOICES — cargos supervisionados não atendem sozinhos
CARGOS_SUPERVISIONADOS = (1, 2)   # Estagiário, Jovem aprendiz

PERFIL_GESTAO = 'gestao'          # sistema completo
PERFIL_TECNICO = 'tecnico'        # versão de campo, atende chamado
PERFIL_APRENDIZ = 'aprendiz'      # versão de campo, só acompanha
PERFIL_SOLICITANTE = 'solicitante'


def eh_administrativo(user):
    """Técnico com a responsabilidade de Administrativo (coordena a fila)."""
    tecnico = getattr(user, 'tecnico', None)
    if tecnico is None:
        return False
    return tecnico.responsabilidades_set.filter(
        responsabilidade=RESP_ADMINISTRATIVO
    ).exists()


def eh_secretario(user):
    return user.secretarias_chefiadas.exists()


def eh_chefe(user):
    return user.subordinados.exists()


def coordena(user):
    """Administrativo, chefe de divisão ou secretário — fica no sistema completo."""
    return bool(
        user.is_superuser or eh_administrativo(user) or eh_secretario(user) or eh_chefe(user)
    )


def eh_aprendiz(user):
    """
    Cargo supervisionado: entra em equipe junto de um técnico, mas não assume
    chamado sozinho. Coordenar (administrativo/chefe/secretário) tira daqui.
    """
    tecnico = getattr(user, 'tecnico', None)
    if tecnico is None or coordena(user):
        return False
    return tecnico.cargo in CARGOS_SUPERVISIONADOS


def perfil_operacional(user):
    """
    Qual versão do sistema esta pessoa usa. É o mesmo valor que o front
    consome pra montar o menu e as rotas.
    """
    if not opera_sistema(user):
        return PERFIL_SOLICITANTE
    if coordena(user):
        return PERFIL_GESTAO
    if not eh_tecnico(user):
        # pessoal da TI que não é técnico nem coordena segue com o completo
        return PERFIL_GESTAO
    return PERFIL_APRENDIZ if eh_aprendiz(user) else PERFIL_TECNICO
