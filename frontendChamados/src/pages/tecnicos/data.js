// Enums/metadata espelhados do back. Dados reais via useTecnicos (API).
//   GET /api/equipes/profissionais/         (Tecnico)
//   GET /api/usuarios/contas/?perfil=tecnico
//   GET /api/equipes/historico-atendimentos/

// Responsabilidades (mirror do back - Tecnico.responsabilidade)
export const RESP = {
  REDES:       0,
  INFRA:       1,
  SUPORTE:     2,
  DESPACHANTE: 3,
  HELPDESK:    4,
}

export const RESP_META = {
  [RESP.REDES]:       { label: 'Redes',       cor: '#0891b2' },
  [RESP.INFRA]:       { label: 'Infra',       cor: '#7c3aed' },
  [RESP.SUPORTE]:     { label: 'Suporte',     cor: '#16a34a' },
  [RESP.DESPACHANTE]: { label: 'Administrativo', cor: '#f97316' },
  [RESP.HELPDESK]:    { label: 'Help desk',   cor: '#dc2626' },
}

// Cargo (mirror de Tecnico.CARGO_CHOICES)
export const CARGO = {
  TECNICO:        0,
  ESTAGIARIO:     1,
  JOVEM_APRENDIZ: 2,
}

export const CARGO_META = {
  [CARGO.TECNICO]:        { label: 'Técnico',        cor: '#4f46e5' },
  [CARGO.ESTAGIARIO]:     { label: 'Estagiário',     cor: '#0891b2' },
  [CARGO.JOVEM_APRENDIZ]: { label: 'Jovem aprendiz', cor: '#16a34a' },
}

// Status visual derivado: onde o técnico está agora.
// Não há meio-termo: ou está alocado numa equipe, ou está livre.
export const STATUS = {
  EM_CAMPO:    'em_campo',    // em equipe aberta (com ou sem chamado)
  DISPONIVEL:  'disponivel',  // disponivel=true, sem equipe
  FOLGA:       'folga',       // disponivel=false
}

export const STATUS_META = {
  [STATUS.EM_CAMPO]:   { label: 'Em campo',    cor: '#2563eb', bg: '#dbeafe' },
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

// Helper
export function statusFromTecnico(t) {
  return STATUS_META[t.status]
}

// Contagens agregadas pra header
export function getResumo(tecnicos) {
  const c = {
    em_campo:   0,
    disponivel: 0,
    folga:      0,
  }
  for (const t of tecnicos) {
    c[t.status] = (c[t.status] || 0) + 1
  }
  return c
}
