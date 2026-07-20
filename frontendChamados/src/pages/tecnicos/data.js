// Mock - substituir por TanStack Query quando wire na API:
//   GET /api/equipes/profissionais/         (Tecnico)
//   GET /api/usuarios/contas/?perfil=tecnico
//   GET /api/equipes/historico-atendimentos/

// Responsabilidades (mirror do back - Tecnico.responsabilidade)
export const RESP = {
  REDES:       0,
  INFRA:       1,
  SUPORTE:     2,
  DESPACHANTE: 3,
  AUDITORIA:   4,
}

export const RESP_META = {
  [RESP.REDES]:       { label: 'Redes',       cor: '#0891b2' },
  [RESP.INFRA]:       { label: 'Infra',       cor: '#7c3aed' },
  [RESP.SUPORTE]:     { label: 'Suporte',     cor: '#16a34a' },
  [RESP.DESPACHANTE]: { label: 'Despachante', cor: '#f97316' },
  [RESP.AUDITORIA]:   { label: 'Auditoria',   cor: '#dc2626' },
}

// Status visual derivado: onde o técnico está agora
export const STATUS = {
  EM_CAMPO:    'em_campo',    // em equipe ativa
  EM_LOBBY:    'em_lobby',    // em formação
  DISPONIVEL:  'disponivel',  // disponivel=true, não engajado
  FOLGA:       'folga',       // disponivel=false
}

export const STATUS_META = {
  [STATUS.EM_CAMPO]:   { label: 'Em campo',    cor: '#2563eb', bg: '#dbeafe' },
  [STATUS.EM_LOBBY]:   { label: 'Em formação', cor: '#4f46e5', bg: '#eef0ff' },
  [STATUS.DISPONIVEL]: { label: 'Disponível',  cor: '#16a34a', bg: '#dcfce7' },
  [STATUS.FOLGA]:      { label: 'Folga',       cor: '#5b5e68', bg: '#f3f2ee' },
}

// Motivo de encerramento (mirror de Atendimento.motivo_encerramento)
export const MOTIVO_META = {
  0: { label: 'Resolvido',    cor: '#16a34a' },
  1: { label: 'Transferido',  cor: '#0891b2' },
  2: { label: 'Turno acabou', cor: '#71717a' },
  3: { label: 'Cancelado',    cor: '#dc2626' },
}

// ===== Seed =====
export const SEED_TECNICOS = [
  {
    id: 1,
    primeiro_nome: 'Rafael',
    nome_completo: 'Rafael Teixeira',
    matricula: 'TEC001',
    responsabilidades: [RESP.INFRA, RESP.REDES],
    status: STATUS.EM_CAMPO,
    contexto: { tipo: 'equipe', label: 'Rafael + Bruna · CH-2841' },
    cor: '#4f46e5',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Datacenter Fazenda',
    atendimentos_hoje: 2,
    atendimentos_mes: 47,
    horas_campo_mes: 168,
  },
  {
    id: 2,
    primeiro_nome: 'Bruna',
    nome_completo: 'Bruna Lima',
    matricula: 'TEC002',
    responsabilidades: [RESP.REDES],
    status: STATUS.EM_CAMPO,
    contexto: { tipo: 'equipe', label: 'Rafael + Bruna · CH-2841' },
    cor: '#0ea5e9',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Datacenter Fazenda',
    atendimentos_hoje: 2,
    atendimentos_mes: 52,
    horas_campo_mes: 172,
  },
  {
    id: 3,
    primeiro_nome: 'Camila',
    nome_completo: 'Camila Souza',
    matricula: 'TEC003',
    responsabilidades: [RESP.SUPORTE, RESP.INFRA],
    status: STATUS.EM_LOBBY,
    contexto: { tipo: 'lobby', label: 'Aguardando saída · CH-2850' },
    cor: '#f97316',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Central de Monitoramento',
    atendimentos_hoje: 1,
    atendimentos_mes: 41,
    horas_campo_mes: 158,
  },
  {
    id: 4,
    primeiro_nome: 'Daniel',
    nome_completo: 'Daniel Pinto',
    matricula: 'TEC004',
    responsabilidades: [RESP.SUPORTE],
    status: STATUS.EM_LOBBY,
    contexto: { tipo: 'lobby', label: 'Aguardando saída · CH-2850' },
    cor: '#10b981',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Central de Monitoramento',
    atendimentos_hoje: 1,
    atendimentos_mes: 38,
    horas_campo_mes: 150,
  },
  {
    id: 5,
    primeiro_nome: 'Henrique',
    nome_completo: 'Henrique Castro',
    matricula: 'TEC005',
    responsabilidades: [RESP.REDES, RESP.INFRA, RESP.SUPORTE],
    status: STATUS.DISPONIVEL,
    contexto: null,
    cor: '#7c3aed',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Datacenter Fazenda',
    atendimentos_hoje: 0,
    atendimentos_mes: 33,
    horas_campo_mes: 140,
  },
  {
    id: 6,
    primeiro_nome: 'Diego',
    nome_completo: 'Diego Albuquerque',
    matricula: 'TEC006',
    responsabilidades: [RESP.REDES],
    status: STATUS.DISPONIVEL,
    contexto: null,
    cor: '#0891b2',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Datacenter Fazenda',
    atendimentos_hoje: 0,
    atendimentos_mes: 29,
    horas_campo_mes: 130,
  },
  {
    id: 7,
    primeiro_nome: 'Carlos',
    nome_completo: 'Carlos Eduardo Reis',
    matricula: 'TEC007',
    responsabilidades: [RESP.SUPORTE, RESP.REDES],
    status: STATUS.DISPONIVEL,
    contexto: null,
    cor: '#ca8a04',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Central de Monitoramento',
    atendimentos_hoje: 0,
    atendimentos_mes: 31,
    horas_campo_mes: 142,
  },
  {
    id: 8,
    primeiro_nome: 'Júlia',
    nome_completo: 'Júlia Mendonça',
    matricula: 'TEC008',
    responsabilidades: [RESP.INFRA],
    status: STATUS.FOLGA,
    contexto: { tipo: 'folga', label: 'Folga até segunda' },
    cor: '#db2777',
    chefe_imediato: 'Marcos Tavares',
    unidade: 'Datacenter Fazenda',
    atendimentos_hoje: 0,
    atendimentos_mes: 42,
    horas_campo_mes: 155,
  },
  {
    id: 9,
    primeiro_nome: 'Felipe',
    nome_completo: 'Felipe Vargas',
    matricula: 'DSP001',
    responsabilidades: [RESP.DESPACHANTE],
    status: STATUS.DISPONIVEL,
    contexto: { tipo: 'sala', label: 'No turno · sala do despacho' },
    cor: '#ea580c',
    chefe_imediato: 'Sandra Oliveira',
    unidade: 'Paço Municipal',
    atendimentos_hoje: 0,
    atendimentos_mes: 0,
    horas_campo_mes: 0,
  },
  {
    id: 10,
    primeiro_nome: 'Sandra',
    nome_completo: 'Sandra Oliveira',
    matricula: 'AUD001',
    responsabilidades: [RESP.AUDITORIA, RESP.DESPACHANTE],
    status: STATUS.DISPONIVEL,
    contexto: null,
    cor: '#dc2626',
    chefe_imediato: null,
    unidade: 'Paço Municipal',
    atendimentos_hoje: 0,
    atendimentos_mes: 0,
    horas_campo_mes: 0,
  },
]

// Histórico de atendimentos do mês por técnico (resumido)
export const SEED_HISTORICO = {
  1: [
    { chamado: 'CH-2841', titulo: 'Troca de VGA',                       inicio: '08:42', fim: null,    parceiro: 'Bruna',  motivo: null },
    { chamado: 'CH-2832', titulo: 'Revisão de gerador a diesel',        inicio: '07:00', fim: '08:30', parceiro: 'Júlia',  motivo: 0 },
    { chamado: 'CH-2820', titulo: 'Ramal 102 muda voltagem',            inicio: 'ontem', fim: 'ontem', parceiro: 'Henrique', motivo: 0 },
  ],
  2: [
    { chamado: 'CH-2841', titulo: 'Troca de VGA',                       inicio: '08:42', fim: null,    parceiro: 'Rafael', motivo: null },
    { chamado: 'CH-2818', titulo: 'Brother manchando impressões',       inicio: 'ontem', fim: 'ontem', parceiro: 'Diego',  motivo: 1 },
  ],
  3: [
    { chamado: 'CH-2828', titulo: 'Iluminação de emergência piscando',  inicio: '06:30', fim: '09:00', parceiro: 'Daniel', motivo: 0 },
  ],
  4: [
    { chamado: 'CH-2828', titulo: 'Iluminação de emergência piscando',  inicio: '06:30', fim: '09:00', parceiro: 'Camila', motivo: 0 },
    { chamado: 'CH-2825', titulo: 'Aquecedor sem ignição',              inicio: 'ontem', fim: 'ontem', parceiro: 'Camila', motivo: 1 },
  ],
}

// Helper
export function statusFromTecnico(t) {
  return STATUS_META[t.status]
}

// Contagens agregadas pra header
export function getResumo(tecnicos) {
  const c = {
    em_campo:   0,
    em_lobby:   0,
    disponivel: 0,
    folga:      0,
  }
  for (const t of tecnicos) {
    c[t.status] = (c[t.status] || 0) + 1
  }
  return c
}
