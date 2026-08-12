// ===== Metadados =====

export const STATUS_META = {
  aberto:                { label: "Aberto",                fg: "#9a3412", bg: "#fff1e6", dot: "#f97316" },
  em_manutencao:         { label: "Em manutenção",         fg: "#854d0e", bg: "#fef7d6", dot: "#eab308" },
  agendado:              { label: "Agendado",              fg: "#3730a3", bg: "#eef0ff", dot: "#6366f1" },
  em_andamento:          { label: "Em andamento",          fg: "#0c4a6e", bg: "#e0f2fe", dot: "#0284c7" },
  // `curto` é o que cabe no chip da tabela; `label` é o texto do select/toast
  em_terceirizada:       { label: "Encaminhado p/ terceirizada", curto: "Terceirizada", fg: "#475569", bg: "#f1f5f9", dot: "#64748b" },
  resolvido:             { label: "Resolvido",             fg: "#14532d", bg: "#dcfce7", dot: "#16a34a" },
  cancelado:             { label: "Cancelado",             fg: "#4b5563", bg: "#f1f1ef", dot: "#9ca3af" },
};

// Status que a DIT pode escolher no chamado
export const STATUS_EDITAVEIS = [
  'aberto', 'em_andamento', 'agendado', 'em_manutencao', 'em_terceirizada',
  'resolvido', 'cancelado',
];

// Cores por terceirizada - quando status === 'em_terceirizada' o chip
// mostra o nome da empresa com a cor dela em vez do label genérico.
export const TERCEIRIZADAS_META = {
  Vivo:    { fg: "#7c2d12", bg: "#fef3c7", dot: "#ca8a04" },
  Método:  { fg: "#1e293b", bg: "#e2e8f0", dot: "#475569" },
  Net:     { fg: "#14532d", bg: "#dcfce7", dot: "#16a34a" },
};

export const PRIORITY_META = {
  urgente: { label: "Urgente", fg: "#ffffff", bg: "#dc2626" },
  alta:    { label: "Alta",    fg: "#9f1239", bg: "#ffe4e6" },
  media:   { label: "Média",   fg: "#854d0e", bg: "#fef3c7" },
  baixa:   { label: "Baixa",   fg: "#166534", bg: "#dcfce7" },
};

export const TEAM_STATUS_META = {
  em_atendimento:  { label: "Em atendimento",  color: "#0284c7", bg: "#e0f2fe" },
  em_deslocamento: { label: "Em deslocamento", color: "#7c3aed", bg: "#ede9fe" },
  disponivel:      { label: "Disponível",      color: "#16a34a", bg: "#dcfce7" },
  pausa:           { label: "Pausa",           color: "#6b7280", bg: "#f3f4f6" },
};

// ===== Seed =====

export const SEED_TEAMS = [
  {
    id: "EQ-01",
    name: "Tec3+Tec5",
    members: [
      { name: "Tec4", initials: "T4", color: "#4f46e5" },
      { name: "Tec5",  initials: "T5", color: "#0ea5e9" },
    ],
    status: "em_atendimento",
    location: "R. 32, 1140 - Lava-pés",
    latitude: -22.9605,   // co-localizada com o chamado CH-2841
    longitude: -46.5478,
    vehicle: { plate: "FQR-2A14", model: "VW Gol" },
    activeTicket: { code: "2841", title: "Cabeamento de rede" },
    startedAt: "08:42",
    tempoAtendimento:"1h 20min",
  },
  {
    id: "EQ-02",
    name: "Tec1+Tec2",
    members: [
      { name: "Tec1", initials: "T1", color: "#f97316" },
      { name: "Tec2", initials: "T2", color: "#10b981" },
    ],
    status: "disponivel",
    location: "CBTI",
    latitude: -22.9525,   // base CBTI
    longitude: -46.5418,
    vehicle: { plate: "GHM-7C92", model: "VW Saveiro" },
    activeTicket: null,
    startedAt: null,
    tempoAtendimento:"-",
  },
];

export const SEED_TICKETS = [
  { code: "2852", title: "Servidor crítico fora do ar",       client: "Secretaria de Saúde - TI Hospitalar",         address: "R. 32, 1140 - Lava-pés",      priority: "urgente", status: "aberto",       openedAt: "11:02", team: null,    date: "Hoje", latitude: -22.9610, longitude: -46.5470 },
  { code: "2851", title: "Telefona não recebe ligações",   client: "Secretaria de Saúde - Atenção Básica",        address: "R. 431, 1340 - Jardim América", priority: "alta",    status: "aberto",       openedAt: "10:42", team: null,    date: "Hoje", latitude: -22.9482, longitude: -46.5365 },
  { code: "2850", title: "Troca de switch",   client: "Secretaria de Educação - Ensino Fundamental", address: "Av. 231, 2055 - Jardim América",     priority: "media",   status: "aberto",       openedAt: "10:18", team: null,    date: "Hoje", latitude: -22.9460, longitude: -46.5380 },
  { code: "2849", title: "Monitor não dá tela",          client: "Secretaria de Saúde - Vigilância Sanitária",  address: "R. 32, 880 - Santa Luzia",       priority: "alta",    status: "aberto",       openedAt: "09:55", team: null,    date: "Hoje", latitude: -22.9438, longitude: -46.5512 },
  { code: "2847", title: "PC não liga.",     client: "Secretaria de Administração - Patrimônio",    address: "R. 76, 2300 - Henedina Cortez",          priority: "baixa",   status: "em_andamento", openedAt: "09:30", team: "EQ-02", date: "Hoje", latitude: -22.9572, longitude: -46.5572 },
  { code: "2845", title: "Substituição de no-break",     client: "Secretaria de Fazenda - Tecnologia",          address: "Av. 12, 4221 - Águas claras",           priority: "alta",    status: "em_andamento", openedAt: "08:58", team: null,    date: "Hoje", latitude: -22.9398, longitude: -46.5285 },
  { code: "2843", title: "Internet caiu",       client: "Secretaria de Esportes - Equipamentos",       address: "R. 2, 1502 - Lava-pés",   priority: "media",   status: "em_manutencao",   openedAt: "08:40", team: null,    date: "Hoje", latitude: -22.9618, longitude: -46.5460 },
  { code: "2841", title: "Cabeamento de rede",      client: "Secretaria de Cultura - Centro Cultural",     address: "Av. 1, 1578 - Bela Vista",        priority: "alta",    status: "em_andamento", openedAt: "08:20", team: "EQ-01", date: "Hoje", latitude: -22.9605, longitude: -46.5478 },
  { code: "2839", title: "Instalar PC",           client: "Secretaria de Obras - Manutenção Predial",    address: "R. 5, 845 - Centro",          priority: "media",   status: "em_andamento", openedAt: "07:40", team: null,    date: "Hoje", latitude: -22.9510, longitude: -46.5430 },
  { code: "2836", title: "Câmera offline",     client: "Secretaria de Segurança - Monitoramento",     address: "Av. 3, 121 - Centro",priority: "baixa",   status: "aberto",       openedAt: "07:12", team: null,    date: "Hoje", latitude: -22.9544, longitude: -46.5402 },

  // Chamados delegados pra terceirizadas
  // terceirizadas é M:N - cada empresa carrega seu próprio protocolo, status e datas
  // (espelha o model ChamadoTerceirizada do back)
  {
    code: "2834", title: "Linha 3899-5566 sem sinal de tronco",
    client: "Secretaria de Cultura - Centro Cultural", address: "Av. 1, 1578 - Bela Vista",
    priority: "alta", status: "em_andamento",
    openedAt: "ontem", team: null, date: "Ontem",
    terceirizadas: [
      {
        empresa: "Vivo", protocolo: "VIV-89421",
        status_chamado: "em_andamento",
        descricao: "Verificar tronco do PABX. Tarja pública sem sinal desde manhã.",
        aberto_em: "12/05 09:14",
        finalizado_em: null,
      },
    ],
  },
  {
    code: "2832", title: "HP M404 com erro de fusor",
    client: "Secretaria de Saúde - Atenção Básica", address: "R. 431, 1340 - Jardim América",
    priority: "media", status: "em_andamento",
    openedAt: "ontem", team: null, date: "Ontem",
    terceirizadas: [
      {
        empresa: "Método", protocolo: "00821",
        status_chamado: "em_andamento",
        descricao: "Impressora apresentando erro 10.92.05. Aguardando técnico no local.",
        aberto_em: "12/05 08:00",
        finalizado_em: null,
      },
    ],
  },
  {
    code: "2830", title: "Link de internet intermitente",
    client: "Secretaria de Educação - Logística", address: "R. 76, 2300 - Henedina Cortez",
    priority: "alta", status: "em_andamento",
    openedAt: "ontem", team: null, date: "Ontem",
    terceirizadas: [
      {
        empresa: "Net", protocolo: "NET-2026-0511",
        status_chamado: "aberto",
        descricao: "Link principal apresentando perda de pacotes acima de 30%.",
        aberto_em: "13/05 06:55",
        finalizado_em: null,
      },
      {
        empresa: "Vivo", protocolo: "VIV-89500",
        status_chamado: "finalizado",
        descricao: "Verificação do link backup. Sem problemas no lado da operadora.",
        aberto_em: "13/05 07:30",
        finalizado_em: "13/05 09:10",
      },
    ],
  },
];

// Empresas terceirizadas cadastradas no sistema (lookup pro seletor do modal)
export const EMPRESAS_DISPONIVEIS = ['Vivo', 'Método', 'Net'];

// Setores cadastrados (secretaria + divisão + endereço/lat/lng).
// No banco real: SELECT JOIN Secretaria, Divisao, Unidade, Endereco.
// Endereço vem por consequência da divisão escolhida (toda divisão tem unidade
// vinculada e toda unidade tem endereço).
export const SETORES_BD = [
  { secretaria: 'Secretaria de Saúde',         divisao: 'TI Hospitalar',        endereco: 'R. 32, 1140 - Lava-pés',             latitude: -22.9605, longitude: -46.5478 },
  { secretaria: 'Secretaria de Saúde',         divisao: 'Atenção Básica',       endereco: 'R. 431, 1340 - Jardim América',      latitude: -22.9482, longitude: -46.5365 },
  { secretaria: 'Secretaria de Saúde',         divisao: 'Vigilância Sanitária', endereco: 'R. 32, 880 - Santa Luzia',           latitude: -22.9438, longitude: -46.5512 },
  { secretaria: 'Secretaria de Educação',      divisao: 'Ensino Fundamental',   endereco: 'Av. 231, 2055 - Jardim América',     latitude: -22.9460, longitude: -46.5380 },
  { secretaria: 'Secretaria de Educação',      divisao: 'Ensino Infantil',      endereco: 'R. das Acácias, 78 - Vila Davi',     latitude: -22.9460, longitude: -46.5598 },
  { secretaria: 'Secretaria de Educação',      divisao: 'Logística',            endereco: 'R. 5, 845 - Centro',                 latitude: -22.9510, longitude: -46.5430 },
  { secretaria: 'Secretaria de Administração', divisao: 'Patrimônio',           endereco: 'R. 76, 2300 - Henedina Cortez',      latitude: -22.9572, longitude: -46.5572 },
  { secretaria: 'Secretaria de Administração', divisao: 'Gabinete',             endereco: 'Praça Raul Leme, S/N - Centro',      latitude: -22.9525, longitude: -46.5418 },
  { secretaria: 'Secretaria de Fazenda',       divisao: 'Tecnologia',           endereco: 'Av. 12, 4221 - Águas claras',        latitude: -22.9398, longitude: -46.5285 },
  { secretaria: 'Secretaria de Cultura',       divisao: 'Centro Cultural',      endereco: 'Av. 1, 1578 - Bela Vista',           latitude: -22.9605, longitude: -46.5478 },
  { secretaria: 'Secretaria de Obras',         divisao: 'Manutenção Predial',   endereco: 'R. 5, 845 - Centro',                 latitude: -22.9510, longitude: -46.5430 },
  { secretaria: 'Secretaria de Segurança',     divisao: 'Monitoramento',        endereco: 'Av. 3, 121 - Centro',                latitude: -22.9544, longitude: -46.5402 },
  { secretaria: 'Secretaria de Esportes',      divisao: 'Equipamentos',         endereco: 'R. 2, 1502 - Lava-pés',              latitude: -22.9618, longitude: -46.5460 },
  { secretaria: 'Secretaria de Assistência',   divisao: 'CRAS Centro',          endereco: 'Av. Tancredo Neves, 900 - Centro',   latitude: -22.9320, longitude: -46.5680 },
];

// Helpers de lookup do banco mockado
export function getSecretariasUnicas() {
  return Array.from(new Set(SETORES_BD.map((s) => s.secretaria))).sort()
}
export function getDivisoesPorSecretaria(secretaria) {
  if (!secretaria) return []
  return SETORES_BD.filter((s) => s.secretaria === secretaria).map((s) => s.divisao)
}
export function getSetor(secretaria, divisao) {
  return SETORES_BD.find((s) => s.secretaria === secretaria && s.divisao === divisao) || null
}

// Status do ChamadoTerceirizada (mirror do back) - perspectiva da terceirizada
// Indexado pelo status_chamado (int) do ChamadoTerceirizada no back
export const TERC_STATUS_META = {
  0: { label: "Aberto",         fg: "#9a3412", bg: "#fff1e6", dot: "#f97316" },
  1: { label: "Em andamento",   fg: "#0c4a6e", bg: "#e0f2fe", dot: "#0284c7" },
  2: { label: "Finalizado",     fg: "#14532d", bg: "#dcfce7", dot: "#16a34a" },
  3: { label: "Não resolvido",  fg: "#7f1d1d", bg: "#fee2e2", dot: "#dc2626" },
};

export const TERC_STATUS = { ABERTO: 0, EM_ANDAMENTO: 1, FINALIZADO: 2, NAO_RESOLVIDO: 3 };
