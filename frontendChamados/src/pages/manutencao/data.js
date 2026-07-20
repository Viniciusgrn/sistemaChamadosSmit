// Mock - substituir por TanStack Query quando wire na API:
//   GET /api/manutencao/ordens/
//   GET /api/equipamento/ativos/  (resolver equipamento)
//   GET /api/chamados/tickets/    (resolver chamado original)
//
// IMPORTANTE: regras de Manutenção (CONTEXTO_PROJETO.md, seção 9):
//   - Criação manual (técnico retira)
//   - Backup obrigatório só pra computadores (tipo = 1)
//   - Localização: texto livre
//   - Finalização exige servico_executado preenchido

// Mirror das choices do back (Manutencao.status)
export const STATUS = {
  EM_ANDAMENTO: 0,
  FINALIZADO:   1,
  NAO_REALIZADA: 2,
}

export const STATUS_META = {
  [STATUS.EM_ANDAMENTO]:  { label: 'Em andamento',    cor: '#ea580c', bg: '#fff1e6' },
  [STATUS.FINALIZADO]:    { label: 'Finalizado',      cor: '#16a34a', bg: '#dcfce7' },
  [STATUS.NAO_REALIZADA]: { label: 'Sem conserto',    cor: '#dc2626', bg: '#fee2e2' },
}

// Tipos de equipamento (mirror de /equipamentos/data.js)
export const TIPO_EQ = {
  IMPRESSORA: 0,
  COMPUTADOR: 1,
  MONITOR:    2,
  TELEFONE:   3,
}

// ===== Seed =====
// Cada manutenção referencia um equipamento pelos campos mais usados
// (não pelo id, pra não criar dependência cruzada de módulo).
export const SEED_MANUTENCOES = [
  {
    id: 1,
    status: STATUS.EM_ANDAMENTO,
    equipamento: { patrimonio: '00012348', marca: 'HP',      modelo: 'EliteDesk 800 G6', tipo: TIPO_EQ.COMPUTADOR },
    chamado_codigo: 'CH-2848',
    diagnostico: 'Sistema travando aleatoriamente, suspeita de pente de RAM defeituoso.',
    servico_executado: null,
    localizacao_atual: 'Mesa do Rafael · Datacenter Fazenda',
    backup: true,
    backup_data: '12/05 09:10',
    backup_feito_por: 'Rafael Teixeira',
    iniciada_em: '12/05 08:45',
    concluida_em: null,
    tecnicos: [
      { id: 1, primeiro_nome: 'Rafael', cor: '#4f46e5' },
      { id: 2, primeiro_nome: 'Bruna',  cor: '#0ea5e9' },
    ],
  },
  {
    id: 2,
    status: STATUS.EM_ANDAMENTO,
    equipamento: { patrimonio: '00020012', marca: 'HP',      modelo: 'LaserJet M404',    tipo: TIPO_EQ.IMPRESSORA },
    chamado_codigo: 'CH-2840',
    diagnostico: 'Erro de fusor (10.92.05). Equipamento enviado para análise externa.',
    servico_executado: null,
    localizacao_atual: 'Assistência PrintMax · Av. Brasil, 800',
    backup: false,  // não é computador
    backup_data: null,
    backup_feito_por: null,
    iniciada_em: '12/05 10:00',
    concluida_em: null,
    tecnicos: [
      { id: 3, primeiro_nome: 'Camila', cor: '#f97316' },
    ],
  },
  {
    id: 3,
    status: STATUS.EM_ANDAMENTO,
    equipamento: { patrimonio: '00012354', marca: 'Positivo', modelo: 'Master D420',     tipo: TIPO_EQ.COMPUTADOR },
    chamado_codigo: 'CH-2855',
    diagnostico: 'Computador não dá POST. Possível placa-mãe.',
    servico_executado: null,
    localizacao_atual: 'Bancada do Henrique',
    backup: false,
    backup_data: null,
    backup_feito_por: null,
    iniciada_em: '13/05 09:30',
    concluida_em: null,
    pendencia: 'backup_pendente',  // computador sem backup ainda
    tecnicos: [
      { id: 5, primeiro_nome: 'Henrique', cor: '#7c3aed' },
    ],
  },
  {
    id: 4,
    status: STATUS.EM_ANDAMENTO,
    equipamento: { patrimonio: '00040003', marca: 'Grandstream', modelo: 'GXP1625',     tipo: TIPO_EQ.TELEFONE },
    chamado_codigo: 'CH-2843',
    diagnostico: 'Sem sinal de tronco. Configuração SIP errada após reset.',
    servico_executado: null,
    localizacao_atual: 'Com o técnico - em diagnóstico remoto',
    backup: false,
    backup_data: null,
    backup_feito_por: null,
    iniciada_em: '12/05 09:14',
    concluida_em: null,
    tecnicos: [
      { id: 2, primeiro_nome: 'Bruna',    cor: '#0ea5e9' },
    ],
  },
  {
    id: 5,
    status: STATUS.FINALIZADO,
    equipamento: { patrimonio: '00012345', marca: 'Dell',     modelo: 'Optiplex 7080',  tipo: TIPO_EQ.COMPUTADOR },
    chamado_codigo: 'CH-2832',
    diagnostico: 'Cooler do processador queimado, superaquecendo.',
    servico_executado: 'Troca do cooler. Aplicação de pasta térmica nova. Limpeza interna.',
    localizacao_atual: 'Devolvido ao solicitante',
    backup: true,
    backup_data: '11/05 14:00',
    backup_feito_por: 'Diego Albuquerque',
    iniciada_em: '11/05 14:30',
    concluida_em: '12/05 11:20',
    tecnicos: [
      { id: 6, primeiro_nome: 'Diego', cor: '#0891b2' },
    ],
  },
  {
    id: 6,
    status: STATUS.FINALIZADO,
    equipamento: { patrimonio: '00030004', marca: 'LG',       modelo: '22MP410',         tipo: TIPO_EQ.MONITOR },
    chamado_codigo: 'CH-2829',
    diagnostico: 'Não detecta sinal HDMI.',
    servico_executado: 'Troca da porta HDMI defeituosa. Substituído por cabo novo na ponta do usuário.',
    localizacao_atual: 'Devolvido - EMEF Jardim Recreio',
    backup: false,
    backup_data: null,
    backup_feito_por: null,
    iniciada_em: '11/05 13:30',
    concluida_em: '11/05 16:00',
    tecnicos: [
      { id: 4, primeiro_nome: 'Daniel', cor: '#10b981' },
    ],
  },
  {
    id: 7,
    status: STATUS.NAO_REALIZADA,
    equipamento: { patrimonio: '00020015', marca: 'Brother',  modelo: 'DCP-L5102',       tipo: TIPO_EQ.IMPRESSORA },
    chamado_codigo: 'CH-2818',
    diagnostico: 'Manchando impressões. Tambor com vida útil esgotada.',
    servico_executado: 'Análise - tambor inviável. Necessária reposição de peça com fornecedor.',
    localizacao_atual: 'Almoxarifado de Obras - aguardando descarte ou reposição',
    backup: false,
    backup_data: null,
    backup_feito_por: null,
    iniciada_em: '10/05 11:00',
    concluida_em: '12/05 17:00',
    tecnicos: [
      { id: 3, primeiro_nome: 'Camila', cor: '#f97316' },
    ],
  },
]

// Agrupa manutenções por status (ordem visual: em andamento → finalizado → sem conserto)
export function agruparPorStatus(manutencoes) {
  const grupos = {
    [STATUS.EM_ANDAMENTO]:  [],
    [STATUS.FINALIZADO]:    [],
    [STATUS.NAO_REALIZADA]: [],
  }
  for (const m of manutencoes) grupos[m.status].push(m)
  return grupos
}

export function getResumo(manutencoes) {
  return {
    em_andamento:  manutencoes.filter((m) => m.status === STATUS.EM_ANDAMENTO).length,
    finalizado:    manutencoes.filter((m) => m.status === STATUS.FINALIZADO).length,
    nao_realizada: manutencoes.filter((m) => m.status === STATUS.NAO_REALIZADA).length,
    backup_pendente: manutencoes.filter(
      (m) => m.status === STATUS.EM_ANDAMENTO &&
             m.equipamento.tipo === TIPO_EQ.COMPUTADOR &&
             !m.backup
    ).length,
  }
}
