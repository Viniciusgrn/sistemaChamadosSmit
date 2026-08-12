"""
Política de urgência do chamado — o único lugar onde os prazos vivem.

Duas regras, ambas só ELEVAM a urgência, nunca abaixam:

1. Quem abriu: chamado aberto por secretário já nasce Alta.
2. Idade: conta desde a abertura e não reinicia — atender não zera o relógio.
   Sobe até no máximo Alta; Crítica não é atingida automaticamente, é decisão
   de gente.

Nada disso passa por cima do despachante: assim que alguém define a urgência
na mão, o chamado ganha `urgencia_manual` e o escalonamento para de opinar.
"""
from django.utils import timezone

# --- prazos (ajuste aqui) ---------------------------------------------------
# dias desde a abertura -> urgência mínima a partir dali. Do mais grave ao menos.
ESCALONAMENTO = [
    (21, 2),   # 3 semanas em aberto -> Alta
    (7,  1),   # 1 semana em aberto  -> Média
]

BAIXA, MEDIA, ALTA, CRITICA = 0, 1, 2, 3


def urgencia_de_abertura(*, eh_secretario):
    """Urgência com que o chamado nasce."""
    return ALTA if eh_secretario else BAIXA


def dias_em_aberto(chamado, agora=None):
    """Idade do chamado em dias. Não reinicia com atendimento."""
    if not chamado.created_at:
        return 0
    agora = agora or timezone.now()
    return max((agora - chamado.created_at).days, 0)


def urgencia_por_idade(dias):
    """Piso de urgência que a idade impõe."""
    for limite, urgencia in ESCALONAMENTO:
        if dias >= limite:
            return urgencia
    return BAIXA


def urgencia_efetiva(chamado, agora=None):
    """
    A urgência que a tela deve mostrar.

    Devolve (urgencia, escalonada) — `escalonada` diz se o valor subiu por
    idade, pra UI poder sinalizar que não foi alguém que mexeu.
    """
    if chamado.urgencia_manual or chamado.status_chamado in chamado.STATUS_ENCERRADOS:
        return chamado.urgencia, False

    piso = urgencia_por_idade(dias_em_aberto(chamado, agora))
    if piso > chamado.urgencia:
        return piso, True
    return chamado.urgencia, False


def dias_para_subir(chamado, agora=None):
    """Dias que faltam pro chamado subir de nível (None se não sobe mais)."""
    if chamado.urgencia_manual or chamado.status_chamado in chamado.STATUS_ENCERRADOS:
        return None
    atual, _ = urgencia_efetiva(chamado, agora)
    if atual >= ALTA:
        return None
    dias = dias_em_aberto(chamado, agora)
    proximos = [lim for lim, urg in sorted(ESCALONAMENTO) if urg > atual and lim > dias]
    return (proximos[0] - dias) if proximos else None
