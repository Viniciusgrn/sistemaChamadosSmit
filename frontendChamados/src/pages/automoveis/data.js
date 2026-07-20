// Mock - substituir por TanStack Query quando wire na API:
//   GET /api/automovel/veiculos/
//   GET /api/automovel/agendamentos/
//   GET /api/equipes/formacoes/        (pra resolver automovel_utilizado)

// Mesmas constantes do back (Automovel.status / Automovel.cor)
export const STATUS = {
  DISPONIVEL: 0,
  MANUTENCAO: 1,
  EM_USO: 2,
}

export const STATUS_META = {
  [STATUS.DISPONIVEL]: { label: 'Disponível',     fg: '#14532d', bg: '#dcfce7', dot: '#16a34a' },
  [STATUS.MANUTENCAO]: { label: 'Em manutenção',  fg: '#7c2d12', bg: '#fff1e6', dot: '#ea580c' },
  [STATUS.EM_USO]:     { label: 'Em uso',         fg: '#1e3a8a', bg: '#dbeafe', dot: '#2563eb' },
}

export const COR = {
  BRANCO: 0,
  PRETO:  1,
  CINZA:  2,
}

export const COR_META = {
  [COR.BRANCO]: { label: 'Branco', hex: '#f4f4f5', borda: '#a1a1aa' },
  [COR.PRETO]:  { label: 'Preto',  hex: '#18181b', borda: '#18181b' },
  [COR.CINZA]:  { label: 'Cinza',  hex: '#71717a', borda: '#52525b' },
}

// ===== Seed =====

export const SEED_VEICULOS = [
  {
    id: 1,
    placa: 'FQR-2A14',
    marca: 'Fiat',
    modelo: 'Strada',
    cor: COR.BRANCO,
    status: STATUS.EM_USO,
  },
  {
    id: 2,
    placa: 'GHM-7C92',
    marca: 'Volkswagen',
    modelo: 'Saveiro',
    cor: COR.PRETO,
    status: STATUS.DISPONIVEL,
  },
]

// Simula Equipe.automovel_utilizado - qual equipe está com qual carro.
// Equipe não tem nome próprio: é a concatenação dos primeiros nomes dos
// técnicos que a formaram naquele turno (~2-3 integrantes).
export const SEED_EQUIPES_USANDO = [
  {
    automovel_id: 1,
    integrantes: ['Tec1', 'Tec2'],
    chamado_codigo: '2841',
  },
]

// Agendamentos futuros (lavagem, manutenção pré-agendada, etc.)
export const SEED_AGENDAMENTOS = [
  {
    id: 1,
    automovel_id: 1,
    data: '2026-05-15',           // sexta
    motivo: 'Lavagem completa',
    tipo_agendamento: 'lavagem',
  },
  {
    id: 2,
    automovel_id: 1,
    data: '2026-05-18',           // segunda
    motivo: 'Revisão preventiva - 10.000 km',
    tipo_agendamento: 'manutencao_preventiva',
  },
  {
    id: 3,
    automovel_id: 2,
    data: '2026-05-22',
    motivo: 'Troca de pneus dianteiros',
    tipo_agendamento: 'manutencao_preventiva',
  },
]

// Helper: monta a view consolidada que cada VeiculoCard precisa
export function getVeiculosCompletos() {
  const hoje = new Date()
  return SEED_VEICULOS.map((v) => {
    const emCampo = SEED_EQUIPES_USANDO.find((e) => e.automovel_id === v.id) || null

    const eventos = SEED_AGENDAMENTOS
      .filter((a) => a.automovel_id === v.id)
      .filter((a) => new Date(a.data) >= new Date(hoje.toDateString()))
      .sort((a, b) => a.data.localeCompare(b.data))

    return { ...v, emCampo, eventos }
  })
}

// Formata data ISO (YYYY-MM-DD) → "Sex 15/05"
export function formatarData(iso) {
  if (!iso) return ''
  // aceita 'YYYY-MM-DD' (mock) ou ISO datetime completo (API)
  const d = iso.length <= 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  if (isNaN(d)) return iso
  const semana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${semana[d.getDay()]} ${dia}/${mes}`
}
