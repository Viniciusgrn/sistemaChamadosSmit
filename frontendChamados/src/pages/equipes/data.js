// Mock - substituir por TanStack Query quando wire na API:
//   GET /api/equipes/profissionais/         (Tecnico)
//   GET /api/equipes/formacoes/             (Equipe - ativas e encerradas)
//   GET /api/equipes/historico-atendimentos/ (Atendimento)
//   GET /api/automovel/veiculos/            (Automovel)
//   GET /api/chamados/tickets/              (Chamado)
//
// ATENÇÃO: depende de campo novo no back - Automovel.assentos (IntegerField).
// Sem ele não dá pra calcular qtd de slots do lobby.

// ===== Responsabilidades (mirror do back) =====
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

// ===== Técnicos =====
// Cada técnico pode ter múltiplas responsabilidades - espelha M:N do back
// (ver CONTEXTO_PROJETO.md, seção 9).
export const SEED_TECNICOS = [
  { id: 1, primeiro_nome: 'Rafael',   nome_completo: 'Rafael Teixeira',   responsabilidades: [RESP.INFRA, RESP.REDES],         disponivel: true,  cor: '#4f46e5' },
  { id: 2, primeiro_nome: 'Bruna',    nome_completo: 'Bruna Lima',        responsabilidades: [RESP.REDES],                     disponivel: true,  cor: '#0ea5e9' },
  { id: 3, primeiro_nome: 'Camila',   nome_completo: 'Camila Souza',      responsabilidades: [RESP.SUPORTE, RESP.INFRA],       disponivel: true,  cor: '#f97316' },
  { id: 4, primeiro_nome: 'Daniel',   nome_completo: 'Daniel Pinto',      responsabilidades: [RESP.SUPORTE],                   disponivel: true,  cor: '#10b981' },
  { id: 5, primeiro_nome: 'Henrique', nome_completo: 'Henrique Castro',   responsabilidades: [RESP.REDES, RESP.INFRA, RESP.SUPORTE], disponivel: true, cor: '#7c3aed' },
  { id: 6, primeiro_nome: 'Júlia',    nome_completo: 'Júlia Mendonça',    responsabilidades: [RESP.INFRA],                     disponivel: false, cor: '#db2777' },
]

// ===== Veículos (precisa de Automovel.assentos no back) =====
export const SEED_VEICULOS = [
  { id: 1, placa: 'FQR-2A14', marca: 'Fiat',       modelo: 'Strada',  assentos: 2 },
  { id: 2, placa: 'GHM-7C92', marca: 'Volkswagen', modelo: 'Saveiro', assentos: 5 },
]

// ===== Chamados (resumo - só o necessário pra mostrar no lobby/card) =====
export const SEED_CHAMADOS = [
  { codigo: 'CH-2841', titulo: 'Troca de VGA',                  urgencia: 2 },
  { codigo: 'CH-2850', titulo: 'Ar-condicionado fazendo barulho', urgencia: 1 },
  { codigo: 'CH-2852', titulo: 'Servidor crítico fora do ar',   urgencia: 3 },
]

// ===== Lobbies (equipes em formação) =====
// Status: ainda não saiu pra campo. Pode ter ou não chamado escolhido.
export const SEED_LOBBIES = [
  {
    id: 'L1',
    veiculo_id: 2,          // Saveiro 5 assentos
    chamado_codigo: 'CH-2850',
    tecnicos_ids: [3, 4],   // Camila + Daniel
    criado_em: '09:14',
  },
  {
    id: 'L2',
    veiculo_id: null,       // sem carro ainda → sem slots calculados
    chamado_codigo: null,
    tecnicos_ids: [5],      // Henrique sozinho
    criado_em: '',
  },
]

// ===== Equipes em campo (já saíram, atendendo) =====
export const SEED_EQUIPES_ATIVAS = [
  {
    id: 'E1',
    veiculo_id: 1,                    // Strada
    chamado_atual_codigo: 'CH-2841',
    tecnicos_ids: [1, 2],             // Rafael + Bruna
    iniciada_em: '08:42',
    qtd_atendimentos_hoje: 2,
  },
]

// ===== Histórico de hoje (encerradas) =====
export const SEED_HISTORICO_HOJE = [
  {
    id: 'H1',
    veiculo_placa: 'FQR-2A14',
    tecnicos_nomes: ['Júlia', 'Rafael'],
    iniciada_em: '07:00',
    encerrada_em: '08:30',
    atendimentos: [
      { codigo: 'CH-2832', titulo: 'Revisão de gerador a diesel', motivo_encerramento: 0 /* Resolvido */ },
    ],
  },
  {
    id: 'H2',
    veiculo_placa: 'GHM-7C92',
    tecnicos_nomes: ['Camila', 'Daniel'],
    iniciada_em: '06:30',
    encerrada_em: '09:00',
    atendimentos: [
      { codigo: 'CH-2828', titulo: 'Iluminação de emergência piscando', motivo_encerramento: 0 },
      { codigo: 'CH-2825', titulo: 'Aquecedor sem ignição',             motivo_encerramento: 1 /* Transferido */ },
    ],
  },
]

export const MOTIVO_ENCERRAMENTO_META = {
  0: { label: 'Resolvido',    cor: '#16a34a' },
  1: { label: 'Transferido',  cor: '#0891b2' },
  2: { label: 'Turno acabou', cor: '#71717a' },
  3: { label: 'Cancelado',    cor: '#dc2626' },
}

// ===== Helpers =====
export function resolveTecnico(id) {
  return SEED_TECNICOS.find((t) => t.id === id) || null
}
export function resolveVeiculo(id) {
  return SEED_VEICULOS.find((v) => v.id === id) || null
}
export function resolveChamado(codigo) {
  return SEED_CHAMADOS.find((c) => c.codigo === codigo) || null
}

// Técnicos livres: não em lobby, não em equipe ativa, e disponivel=true
export function getTecnicosLivres() {
  const ocupadosLobby = SEED_LOBBIES.flatMap((l) => l.tecnicos_ids)
  const ocupadosAtivos = SEED_EQUIPES_ATIVAS.flatMap((e) => e.tecnicos_ids)
  const ocupados = new Set([...ocupadosLobby, ...ocupadosAtivos])
  return SEED_TECNICOS.filter((t) => t.disponivel && !ocupados.has(t.id))
}

export function nomeEquipe(tecnicos) {
  return tecnicos.map((t) => t.primeiro_nome).join(' + ')
}
