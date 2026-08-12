// Enums/metadata espelhados do back. Dados reais vêm via useEquipes (API):
//   GET /api/equipes/formacoes/  (Equipe: lobby, em campo e encerradas)
//   GET /api/equipes/profissionais/ (Tecnico)

// ===== Responsabilidades (mirror do back) =====
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
  [RESP.DESPACHANTE]: { label: 'Despachante', cor: '#f97316' },
  [RESP.HELPDESK]:    { label: 'Help desk',   cor: '#dc2626' },
}

// ===== Motivo de encerramento do Atendimento =====
export const MOTIVO_ENCERRAMENTO_META = {
  0: { label: 'Resolvido',    cor: '#16a34a' },
  1: { label: 'Transferido',  cor: '#0891b2' },
  2: { label: 'Turno acabou', cor: '#71717a' },
  3: { label: 'Cancelado',    cor: '#dc2626' },
}

// ===== Helpers =====
export function nomeEquipe(tecnicos) {
  return tecnicos.map((t) => t.primeiro_nome).join(' + ')
}
