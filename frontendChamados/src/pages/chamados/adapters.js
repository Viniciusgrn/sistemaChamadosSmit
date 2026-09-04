// Adapta Chamado da API -> shape que a tabela/mapa/modais da DIT consomem.
//
// A tela nasceu com chaves de texto ('aberto', 'urgente'); o backend usa ints.
// Este adapter é o único lugar que conhece as duas convenções.

// status_chamado (int) -> chave visual
export const STATUS_POR_INT = {
  0: 'aberto',
  1: 'em_andamento',
  2: 'resolvido',
  3: 'cancelado',
  4: 'em_manutencao',
  5: 'agendado',
  6: 'em_terceirizada',
}

export const INT_POR_STATUS = Object.fromEntries(
  Object.entries(STATUS_POR_INT).map(([int, chave]) => [chave, Number(int)])
)

// urgencia (int) -> chave visual
export const PRIORIDADE_POR_INT = {
  0: 'baixa',
  1: 'media',
  2: 'alta',
  3: 'urgente',
}

export const INT_POR_PRIORIDADE = Object.fromEntries(
  Object.entries(PRIORIDADE_POR_INT).map(([int, chave]) => [chave, Number(int)])
)

// "2026-08-07T17:29:45Z" -> "17:29"
function soHora(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// "Hoje" / "Ontem" / "07/08"
function rotuloData(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(hoje)
  ontem.setDate(hoje.getDate() - 1)
  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function iniciais(nome) {
  return (nome || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

const CORES_MEMBRO = ['#4f46e5', '#0ea5e9', '#f97316', '#10b981', '#7c3aed', '#dc2626']

export function adaptaChamado(c) {
  // "Em terceirizada" agora é status de verdade no banco - não é mais deduzido
  // da existência de delegações
  const status = STATUS_POR_INT[c.status_chamado] || 'aberto'
  const statusBase = status

  const equipe = c.equipe_atual

  return {
    // identificação
    id: c.id,
    code: String(c.id),
    title: c.titulo,
    descricao: c.descricao,

    // origem
    client: c.secretaria_sigla
      ? `${c.secretaria_sigla} - ${c.divisao_nome || c.unidade_nome}`
      : c.unidade_nome,
    unidade_nome: c.unidade_nome,
    address: c.endereco || '',
    // interno = dentro do Paço: a equipe resolve sem sair do prédio
    interno: !!c.interno,
    // pra centralizar o mapa de Localidades neste endereço
    enderecoId: c.endereco_id ?? null,
    latitude: c.latitude != null ? Number(c.latitude) : null,
    longitude: c.longitude != null ? Number(c.longitude) : null,

    // classificação
    status,
    statusReal: statusBase,          // ignora a derivação de terceirizada
    status_chamado: c.status_chamado, // valor cru pro select
    // `priority` é a urgência EFETIVA: a gravada, já elevada pelo tempo em
    // aberto quando ninguém definiu na mão. É ela que a tela ordena e filtra.
    priority: PRIORIDADE_POR_INT[c.urgencia_efetiva ?? c.urgencia] || 'baixa',
    // urgencia crua = o que está no banco, é o valor que o select edita
    urgencia: c.urgencia,
    urgenciaManual: !!c.urgencia_manual,
    urgenciaEscalonada: !!c.urgencia_escalonada,
    diasEmAberto: c.dias_em_aberto ?? null,
    diasParaSubir: c.dias_para_subir ?? null,
    tipo_display: c.tipo_display,

    // pessoas
    solicitante: c.solicitante,
    solicitante_nome: c.solicitante_nome || c.nome_solicitante,
    // histórico de atendimentos; `observacoes` é o comentário do técnico ao
    // encerrar (vazio quando ele não escreveu nada)
    atendimentos: (c.atendimentos || []).map((a) => ({
      id: a.id,
      tecnicos: a.tecnicos || [],
      iniciado_em: a.iniciado_em,
      encerrado_em: a.encerrado_em,
      motivo: a.motivo,
      motivo_display: a.motivo_display,
      observacoes: a.observacoes || '',
      instrucoes: a.instrucoes || '',
    })),

    // tempo
    openedAt: soHora(c.created_at),
    date: rotuloData(c.created_at),
    created_at: c.created_at,
    finalizado_em: c.finalizado_em,

    // atendimento
    team: equipe ? String(equipe.id) : null,
    // ids dos Tecnico na equipe: o front compara com o tecnico_id da sessão
    // pra saber se quem está atendendo é o próprio usuário
    equipeTecnicoIds: (equipe?.tecnicos || []).map((t) => t.id),
    equipe: equipe
      ? {
          id: String(equipe.id),
          name: (equipe.tecnicos || []).map((t) => t.nome.split(' ')[0]).join(' + '),
          members: (equipe.tecnicos || []).map((t, i) => ({
            name: t.nome,
            initials: iniciais(t.nome),
            color: CORES_MEMBRO[i % CORES_MEMBRO.length],
          })),
          vehicle: equipe.automovel ? { model: equipe.automovel, plate: equipe.placa } : null,
        }
      : null,
    terceirizadas: c.terceirizadas || [],
  }
}
