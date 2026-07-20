// Mock - substituir por TanStack Query quando wire na API:
//   GET /api/localidades/enderecos/
//   GET /api/localidades/unidades/
// Coordenadas plausíveis de Bragança Paulista / SP.

export const SEED_BAIRROS = [
  { id: 1,  nome: 'Centro',           rural: false },
  { id: 2,  nome: 'Lavapés',          rural: false },
  { id: 3,  nome: 'Jardim Recreio',   rural: false },
  { id: 4,  nome: 'Jardim Petrópolis', rural: false },
  { id: 5,  nome: 'Vila Aparecida',   rural: false },
  { id: 6,  nome: 'Taboão',           rural: false },
  { id: 7,  nome: 'Águas Claras',     rural: false },
  { id: 8,  nome: 'São Lourenço',     rural: false },
  { id: 9,  nome: 'Vila Davi',        rural: false },
  { id: 10, nome: 'Cidade Planejada', rural: false },
  { id: 11, nome: 'Cachoeira',        rural: true  },
  { id: 12, nome: 'Jardim Europa',    rural: false },
]

export const SEED_SECRETARIAS = [
  { id: 1, nome: 'Secretaria de Saúde',         sigla: 'SMS', cor: '#dc2626' },
  { id: 2, nome: 'Secretaria de Educação',      sigla: 'SME', cor: '#2563eb' },
  { id: 3, nome: 'Secretaria de Administração', sigla: 'SMA', cor: '#7c3aed' },
  { id: 4, nome: 'Secretaria de Fazenda',       sigla: 'SF',  cor: '#16a34a' },
  { id: 5, nome: 'Secretaria de Cultura',       sigla: 'SMC', cor: '#f97316' },
  { id: 6, nome: 'Secretaria de Obras',         sigla: 'SO',  cor: '#0891b2' },
  { id: 7, nome: 'Secretaria de Segurança',     sigla: 'SS',  cor: '#475569' },
  { id: 8, nome: 'Secretaria de Esportes',      sigla: 'SE',  cor: '#ca8a04' },
  { id: 9, nome: 'Secretaria de Assistência',   sigla: 'SAS', cor: '#db2777' },
]

// Endereços plausíveis em Bragança Paulista (lat/lng aproximadas)
export const SEED_ENDERECOS = [
  {
    id: 1,
    rua: 'Praça Raul Leme',
    numero: 'S/N',
    bairro_id: 1,
    ponto_referencia: 'Paço Municipal',
    latitude: -22.9525,
    longitude: -46.5418,
  },
  {
    id: 2,
    rua: 'Av. Dr. Antônio Pires Pimentel',
    numero: '835',
    bairro_id: 1,
    ponto_referencia: 'Próximo à rodoviária',
    latitude: -22.9544,
    longitude: -46.5402,
  },
  {
    id: 3,
    rua: 'Rua dos Andradas',
    numero: '420',
    bairro_id: 1,
    ponto_referencia: 'Centro comercial',
    latitude: -22.9510,
    longitude: -46.5430,
  },
  {
    id: 4,
    rua: 'Av. Cel. João Leme dos Santos',
    numero: '1200',
    bairro_id: 2,
    ponto_referencia: '',
    latitude: -22.9605,
    longitude: -46.5478,
  },
  {
    id: 5,
    rua: 'Rua Major Pinheiro Fróes',
    numero: '655',
    bairro_id: 3,
    ponto_referencia: 'Em frente ao parque',
    latitude: -22.9482,
    longitude: -46.5365,
  },
  {
    id: 6,
    rua: 'Av. dos Imigrantes',
    numero: '2410',
    bairro_id: 4,
    ponto_referencia: '',
    latitude: -22.9618,
    longitude: -46.5298,
  },
  {
    id: 7,
    rua: 'Rua São José',
    numero: '180',
    bairro_id: 5,
    ponto_referencia: 'Próximo à igreja',
    latitude: -22.9438,
    longitude: -46.5512,
  },
  {
    id: 8,
    rua: 'Rua Riachuelo',
    numero: '90',
    bairro_id: 6,
    ponto_referencia: '',
    latitude: -22.9572,
    longitude: -46.5572,
  },
  {
    id: 9,
    rua: 'Av. Brasil',
    numero: '1850',
    bairro_id: 7,
    ponto_referencia: 'Próximo ao supermercado',
    latitude: -22.9398,
    longitude: -46.5285,
  },
  {
    id: 10,
    rua: 'Rua Coronel Teófilo Leme',
    numero: '305',
    bairro_id: 8,
    ponto_referencia: '',
    latitude: -22.9682,
    longitude: -46.5425,
  },
  {
    id: 11,
    rua: 'Rua das Acácias',
    numero: '78',
    bairro_id: 9,
    ponto_referencia: 'Quase esquina com Av. das Palmeiras',
    latitude: -22.9460,
    longitude: -46.5598,
  },
  {
    id: 12,
    rua: 'Estrada Municipal da Cachoeira',
    numero: 'km 3',
    bairro_id: 11,
    ponto_referencia: 'Após a ponte do córrego',
    latitude: -22.9015,
    longitude: -46.5012,
  },
  {
    id: 13,
    rua: 'Av. Tancredo Neves',
    numero: '900',
    bairro_id: 10,
    ponto_referencia: 'Bairro Cidade Planejada',
    latitude: -22.9320,
    longitude: -46.5680,
  },
  {
    id: 14,
    rua: 'Rua dos Lírios',
    numero: '142',
    bairro_id: 12,
    ponto_referencia: '',
    latitude: -22.9762,
    longitude: -46.5145,
  },
]

export const SEED_UNIDADES = [
  // Paço Municipal - várias secretarias no mesmo endereço (testa o "+N")
  { id: 1,  nome: 'Gabinete do Prefeito',        endereco_id: 1, secretaria_id: 3, paco_municipal: true },
  { id: 2,  nome: 'Secretaria de Administração', endereco_id: 1, secretaria_id: 3, paco_municipal: true },
  { id: 3,  nome: 'Secretaria de Fazenda',       endereco_id: 1, secretaria_id: 4, paco_municipal: true },
  { id: 4,  nome: 'Secretaria de Saúde',         endereco_id: 1, secretaria_id: 1, paco_municipal: true },
  { id: 5,  nome: 'Secretaria de Educação',      endereco_id: 1, secretaria_id: 2, paco_municipal: true },
  { id: 6,  nome: 'Secretaria de Cultura',       endereco_id: 1, secretaria_id: 5, paco_municipal: true },
  { id: 7,  nome: 'Secretaria de Obras',         endereco_id: 1, secretaria_id: 6, paco_municipal: true },
  { id: 8,  nome: 'Secretaria de Esportes',      endereco_id: 1, secretaria_id: 8, paco_municipal: true },
  { id: 9,  nome: 'Secretaria de Assistência',   endereco_id: 1, secretaria_id: 9, paco_municipal: true },

  // Outras unidades espalhadas
  { id: 10, nome: 'Rodoviária Municipal',        endereco_id: 2, secretaria_id: 6, paco_municipal: false },
  { id: 11, nome: 'Mercado Municipal',           endereco_id: 3, secretaria_id: 3, paco_municipal: false },
  { id: 12, nome: 'UBS Lavapés',                 endereco_id: 4, secretaria_id: 1, paco_municipal: false },
  { id: 13, nome: 'EMEF Jardim Recreio',         endereco_id: 5, secretaria_id: 2, paco_municipal: false },
  { id: 14, nome: 'Centro Esportivo Recreio',    endereco_id: 5, secretaria_id: 8, paco_municipal: false },
  { id: 15, nome: 'CRAS Jardim Petrópolis',      endereco_id: 6, secretaria_id: 9, paco_municipal: false },
  { id: 16, nome: 'EMEI Vila Aparecida',         endereco_id: 7, secretaria_id: 2, paco_municipal: false },
  { id: 17, nome: 'Delegacia da Mulher',         endereco_id: 8, secretaria_id: 7, paco_municipal: false },
  { id: 18, nome: 'UBS Águas Claras',            endereco_id: 9, secretaria_id: 1, paco_municipal: false },
  { id: 19, nome: 'EMEF São Lourenço',           endereco_id: 10, secretaria_id: 2, paco_municipal: false },
  { id: 20, nome: 'Almoxarifado de Obras',       endereco_id: 11, secretaria_id: 6, paco_municipal: false },
  { id: 21, nome: 'Posto de Saúde Rural',        endereco_id: 12, secretaria_id: 1, paco_municipal: false },
  { id: 22, nome: 'Centro Cultural Cidade',      endereco_id: 13, secretaria_id: 5, paco_municipal: false },
  { id: 23, nome: 'EMEI Jardim Europa',          endereco_id: 14, secretaria_id: 2, paco_municipal: false },
]

// Helpers que simulam joins do back
export function getEnderecosComUnidades() {
  return SEED_ENDERECOS.map((e) => ({
    ...e,
    bairro: SEED_BAIRROS.find((b) => b.id === e.bairro_id),
    unidades: SEED_UNIDADES.filter((u) => u.endereco_id === e.id).map((u) => ({
      ...u,
      secretaria: SEED_SECRETARIAS.find((s) => s.id === u.secretaria_id),
    })),
  }))
}

// Centro de Bragança Paulista
export const MAPA_CENTRO = [-22.9519, -46.5419]
export const MAPA_ZOOM = 14

// =================================================================
// Layout interno do Paço (endereço id=1) - placeholder SVG.
// Quando a planta real chegar (PNG), só substitui imagens[andar] e
// ajusta as coordenadas (rect: x,y,w,h em px do viewBox).
// =================================================================
export const PACO_ENDERECO_ID = 1

export const PACO_LAYOUT = {
  // viewBox do SVG; troca quando a planta real chegar
  viewBox: { w: 1000, h: 700 },
  // imagens por andar (a setar depois)
  imagens: {
    1: null, // ex: '/plantas/paco-andar-1.png'
    2: null,
  },
  // Salas - cada uma agrupa 1+ unidades vinculadas ao endereço do Paço
  salas: [
    // ----- Andar 1 (térreo) -----
    {
      id: 's1-recepcao',
      andar: 1,
      label: 'Recepção',
      unidade_ids: [],
      rect: { x: 420, y: 580, w: 160, h: 80 },
    },
    {
      id: 's1-gabinete',
      andar: 1,
      label: 'Gabinete + Administração',
      unidade_ids: [1, 2], // Gabinete do Prefeito + Sec. de Administração
      rect: { x: 380, y: 290, w: 240, h: 260 },
    },
    {
      id: 's1-fazenda',
      andar: 1,
      label: 'Fazenda',
      unidade_ids: [3],
      rect: { x: 660, y: 290, w: 240, h: 260 },
    },
    {
      id: 's1-saude',
      andar: 1,
      label: 'Saúde',
      unidade_ids: [4],
      rect: { x: 100, y: 100, w: 360, h: 160 },
    },
    {
      id: 's1-educacao',
      andar: 1,
      label: 'Educação',
      unidade_ids: [5],
      rect: { x: 540, y: 100, w: 360, h: 160 },
    },
    {
      id: 's1-admin-secundaria',
      andar: 1,
      label: 'Apoio Administrativo',
      unidade_ids: [],
      rect: { x: 100, y: 290, w: 240, h: 260 },
    },

    // ----- Andar 2 (superior) -----
    {
      id: 's2-cultura',
      andar: 2,
      label: 'Cultura',
      unidade_ids: [6],
      rect: { x: 100, y: 100, w: 380, h: 240 },
    },
    {
      id: 's2-obras',
      andar: 2,
      label: 'Obras',
      unidade_ids: [7],
      rect: { x: 520, y: 100, w: 380, h: 240 },
    },
    {
      id: 's2-esportes',
      andar: 2,
      label: 'Esportes',
      unidade_ids: [8],
      rect: { x: 100, y: 370, w: 380, h: 230 },
    },
    {
      id: 's2-assistencia',
      andar: 2,
      label: 'Assistência Social',
      unidade_ids: [9],
      rect: { x: 520, y: 370, w: 380, h: 230 },
    },
  ],
}

// Helper: pega as unidades do Paço já com secretaria resolvida
export function getUnidadesDoPaco() {
  return SEED_UNIDADES.filter((u) => u.endereco_id === PACO_ENDERECO_ID).map((u) => ({
    ...u,
    secretaria: SEED_SECRETARIAS.find((s) => s.id === u.secretaria_id),
  }))
}

// Helper: dado um unidade_id, retorna a sala que contém ela
export function getSalaPorUnidade(unidadeId) {
  return PACO_LAYOUT.salas.find((s) => s.unidade_ids.includes(unidadeId)) || null
}
