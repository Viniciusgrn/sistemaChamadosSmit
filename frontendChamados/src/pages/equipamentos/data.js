// Mock - substituir por TanStack Query quando wire na API:
//   GET /api/equipamento/ativos/
//   GET /api/manutencao/ordens/      (histórico por equipamento)
//   GET /api/chamados/tickets/        (M:N com equipamentos)

import { Printer, Monitor, Phone, Cpu } from 'lucide-react'

// Mirror das choices do back (Equipamento.tipo_equipamento)
export const TIPO = {
  IMPRESSORA: 0,
  COMPUTADOR: 1,
  MONITOR:    2,
  TELEFONE:   3,
}

export const TIPO_META = {
  [TIPO.IMPRESSORA]: { label: 'Impressora', icon: Printer, cor: '#475569' },
  [TIPO.COMPUTADOR]: { label: 'Computador', icon: Cpu,     cor: '#2563eb' },
  [TIPO.MONITOR]:    { label: 'Monitor',    icon: Monitor, cor: '#0891b2' },
  [TIPO.TELEFONE]:   { label: 'Telefone',   icon: Phone,   cor: '#ca8a04' },
}

// Mirror das choices do back (Equipamento.status)
export const STATUS = {
  EM_USO:        0,
  ESTOQUE:       1,
  EM_MANUTENCAO: 2,
  DESCARTE:      3,
}

export const STATUS_META = {
  [STATUS.EM_USO]:        { label: 'Em uso',        cor: '#16a34a', bg: '#dcfce7' },
  [STATUS.ESTOQUE]:       { label: 'Estoque',       cor: '#0891b2', bg: '#e0f7fa' },
  [STATUS.EM_MANUTENCAO]: { label: 'Em manutenção', cor: '#ea580c', bg: '#fff1e6' },
  [STATUS.DESCARTE]:      { label: 'Descarte',      cor: '#dc2626', bg: '#fee2e2' },
}

// ===== Seed =====
// 32 equipamentos espalhados pelas unidades do mock (mesmos nomes usados em Unidades)
export const SEED_EQUIPAMENTOS = [
  // Computadores
  { id: 1,  patrimonio: '00012345', numero_de_serie: 'BR-DELL-882011', marca: 'Dell',     modelo: 'Optiplex 7080',     tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'Paço Municipal'           },
  { id: 2,  patrimonio: '00012346', numero_de_serie: 'BR-DELL-882012', marca: 'Dell',     modelo: 'Optiplex 7080',     tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'Paço Municipal'           },
  { id: 3,  patrimonio: '00012347', numero_de_serie: 'BR-HP-441230',   marca: 'HP',       modelo: 'EliteDesk 800 G6',  tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'UBS Lavapés'              },
  { id: 4,  patrimonio: '00012348', numero_de_serie: 'BR-HP-441231',   marca: 'HP',       modelo: 'EliteDesk 800 G6',  tipo: TIPO.COMPUTADOR, status: STATUS.EM_MANUTENCAO, unidade: 'UBS Lavapés'              },
  { id: 5,  patrimonio: '00012349', numero_de_serie: 'BR-LEN-330021',  marca: 'Lenovo',   modelo: 'ThinkCentre M70q',  tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'EMEF Jardim Recreio'       },
  { id: 6,  patrimonio: '00012350', numero_de_serie: 'BR-LEN-330022',  marca: 'Lenovo',   modelo: 'ThinkCentre M70q',  tipo: TIPO.COMPUTADOR, status: STATUS.ESTOQUE,       unidade: 'Almoxarifado de Obras'    },
  { id: 7,  patrimonio: '00012351', numero_de_serie: 'BR-DELL-882500', marca: 'Dell',     modelo: 'Vostro 3681',       tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'Mercado Municipal'        },
  { id: 8,  patrimonio: '00012352', numero_de_serie: 'BR-DELL-882501', marca: 'Dell',     modelo: 'Vostro 3681',       tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'EMEI Vila Aparecida'      },
  { id: 9,  patrimonio: '00012353', numero_de_serie: 'BR-POS-220045',  marca: 'Positivo', modelo: 'Master D420',       tipo: TIPO.COMPUTADOR, status: STATUS.DESCARTE,      unidade: 'Almoxarifado de Obras'    },
  { id: 10, patrimonio: '00012354', numero_de_serie: 'BR-POS-220046',  marca: 'Positivo', modelo: 'Master D420',       tipo: TIPO.COMPUTADOR, status: STATUS.EM_MANUTENCAO, unidade: 'Centro Esportivo Recreio' },
  { id: 11, patrimonio: '00012355', numero_de_serie: 'BR-HP-441288',   marca: 'HP',       modelo: 'ProDesk 600 G6',    tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'CRAS Jardim Petrópolis'   },
  { id: 12, patrimonio: '00012356', numero_de_serie: 'BR-LEN-330099',  marca: 'Lenovo',   modelo: 'ThinkCentre M75q',  tipo: TIPO.COMPUTADOR, status: STATUS.EM_USO,        unidade: 'Delegacia da Mulher'      },

  // Impressoras
  { id: 13, patrimonio: '00020012', numero_de_serie: 'HP-M404-7710',   marca: 'HP',       modelo: 'LaserJet M404',     tipo: TIPO.IMPRESSORA, status: STATUS.EM_MANUTENCAO, unidade: 'UBS Lavapés'              },
  { id: 14, patrimonio: '00020013', numero_de_serie: 'HP-M404-7711',   marca: 'HP',       modelo: 'LaserJet M404',     tipo: TIPO.IMPRESSORA, status: STATUS.EM_USO,        unidade: 'Paço Municipal'           },
  { id: 15, patrimonio: '00020014', numero_de_serie: 'BR-L5102-22',    marca: 'Brother',  modelo: 'DCP-L5102',         tipo: TIPO.IMPRESSORA, status: STATUS.EM_USO,        unidade: 'EMEF Jardim Recreio'       },
  { id: 16, patrimonio: '00020015', numero_de_serie: 'BR-L5102-23',    marca: 'Brother',  modelo: 'DCP-L5102',         tipo: TIPO.IMPRESSORA, status: STATUS.EM_MANUTENCAO, unidade: 'CRAS Jardim Petrópolis'   },
  { id: 17, patrimonio: '00020016', numero_de_serie: 'EP-L3250-501',   marca: 'Epson',    modelo: 'EcoTank L3250',     tipo: TIPO.IMPRESSORA, status: STATUS.EM_USO,        unidade: 'EMEI Jardim Europa'       },
  { id: 18, patrimonio: '00020017', numero_de_serie: 'EP-L3250-502',   marca: 'Epson',    modelo: 'EcoTank L3250',     tipo: TIPO.IMPRESSORA, status: STATUS.ESTOQUE,       unidade: 'Almoxarifado de Obras'    },
  { id: 19, patrimonio: '00020018', numero_de_serie: 'XR-WC-3025-001', marca: 'Xerox',    modelo: 'WorkCentre 3025',   tipo: TIPO.IMPRESSORA, status: STATUS.DESCARTE,      unidade: 'Almoxarifado de Obras'    },

  // Monitores
  { id: 20, patrimonio: '00030001', numero_de_serie: 'DEL-E2422-001',  marca: 'Dell',     modelo: 'E2422HS',           tipo: TIPO.MONITOR,    status: STATUS.EM_USO,        unidade: 'Paço Municipal'           },
  { id: 21, patrimonio: '00030002', numero_de_serie: 'DEL-E2422-002',  marca: 'Dell',     modelo: 'E2422HS',           tipo: TIPO.MONITOR,    status: STATUS.EM_USO,        unidade: 'Paço Municipal'           },
  { id: 22, patrimonio: '00030003', numero_de_serie: 'LG-22MP410-7',   marca: 'LG',       modelo: '22MP410',           tipo: TIPO.MONITOR,    status: STATUS.EM_USO,        unidade: 'UBS Lavapés'              },
  { id: 23, patrimonio: '00030004', numero_de_serie: 'LG-22MP410-8',   marca: 'LG',       modelo: '22MP410',           tipo: TIPO.MONITOR,    status: STATUS.EM_MANUTENCAO, unidade: 'EMEF Jardim Recreio'       },
  { id: 24, patrimonio: '00030005', numero_de_serie: 'AOC-22B1H-44',   marca: 'AOC',      modelo: '22B1H',             tipo: TIPO.MONITOR,    status: STATUS.ESTOQUE,       unidade: 'Almoxarifado de Obras'    },
  { id: 25, patrimonio: '00030006', numero_de_serie: 'SAM-LS22-101',   marca: 'Samsung',  modelo: 'LS22A33',           tipo: TIPO.MONITOR,    status: STATUS.EM_USO,        unidade: 'Delegacia da Mulher'      },

  // Telefones
  { id: 26, patrimonio: '00040001', numero_de_serie: 'GS-T46-2201',    marca: 'Yealink',  modelo: 'SIP-T46S',          tipo: TIPO.TELEFONE,   status: STATUS.EM_USO,        unidade: 'Paço Municipal'           },
  { id: 27, patrimonio: '00040002', numero_de_serie: 'GS-T46-2202',    marca: 'Yealink',  modelo: 'SIP-T46S',          tipo: TIPO.TELEFONE,   status: STATUS.EM_USO,        unidade: 'Paço Municipal'           },
  { id: 28, patrimonio: '00040003', numero_de_serie: 'GP-GXP1625-08',  marca: 'Grandstream', modelo: 'GXP1625',        tipo: TIPO.TELEFONE,   status: STATUS.EM_MANUTENCAO, unidade: 'UBS Lavapés'              },
  { id: 29, patrimonio: '00040004', numero_de_serie: 'GP-GXP1625-09',  marca: 'Grandstream', modelo: 'GXP1625',        tipo: TIPO.TELEFONE,   status: STATUS.EM_USO,        unidade: 'CRAS Jardim Petrópolis'   },
  { id: 30, patrimonio: '00040005', numero_de_serie: 'IN-IP120-11',    marca: 'Intelbras',modelo: 'IP120',             tipo: TIPO.TELEFONE,   status: STATUS.ESTOQUE,       unidade: 'Almoxarifado de Obras'    },
  { id: 31, patrimonio: '00040006', numero_de_serie: 'IN-IP120-12',    marca: 'Intelbras',modelo: 'IP120',             tipo: TIPO.TELEFONE,   status: STATUS.DESCARTE,      unidade: 'Almoxarifado de Obras'    },
  { id: 32, patrimonio: '00040007', numero_de_serie: 'IN-TIP200-7',    marca: 'Intelbras',modelo: 'TIP 200',           tipo: TIPO.TELEFONE,   status: STATUS.EM_USO,        unidade: 'Centro Cultural Cidade'   },
]

// Histórico de chamados que envolveram cada equipamento (M:N Chamado↔Equipamento)
export const SEED_HISTORICO_CHAMADOS = {
  4:  [
    { chamado: 'CH-2840', titulo: 'HP M404 com erro de fusor',          status: 'em_andamento', data: '12/05 08:00' },
    { chamado: 'CH-2700', titulo: 'Reinstalação do sistema',             status: 'resolvido',    data: '02/04 14:30' },
  ],
  13: [
    { chamado: 'CH-2840', titulo: 'HP M404 com erro de fusor',          status: 'em_andamento', data: '12/05 08:00' },
  ],
  16: [
    { chamado: 'CH-2818', titulo: 'Brother manchando impressões',       status: 'nao_resolvido',data: '09/05 11:00' },
  ],
  10: [
    { chamado: 'CH-2855', titulo: 'Computador não liga',                 status: 'aberto',       data: '13/05 10:42' },
  ],
  28: [
    { chamado: 'CH-2843', titulo: 'Linha 3899-5566 sem sinal de tronco', status: 'em_andamento', data: '12/05 09:14' },
    { chamado: 'CH-2766', titulo: 'Ramal travando ao discar',            status: 'resolvido',    data: '15/04 09:00' },
  ],
  23: [
    { chamado: 'CH-2829', titulo: 'Monitor não detecta sinal HDMI',      status: 'em_andamento', data: '11/05 13:20' },
  ],
}

// Histórico de manutenções (Manutencao por equipamento)
export const SEED_HISTORICO_MANUTENCOES = {
  4: [
    { id: 1, status: 'finalizado',    diagnostico: 'Cooler queimado',       servico_executado: 'Troca de cooler',           data_inicio: '02/04', data_fim: '03/04' },
  ],
  13: [
    { id: 2, status: 'em_andamento',  diagnostico: 'Falha no fusor',         servico_executado: null,                         data_inicio: '12/05', data_fim: null },
  ],
  16: [
    { id: 3, status: 'nao_realizada', diagnostico: 'Tambor com vida útil esgotada - solicitar reposição', servico_executado: null, data_inicio: '10/05', data_fim: '12/05' },
  ],
  10: [
    { id: 4, status: 'em_andamento',  diagnostico: 'Aguardando análise',     servico_executado: null,                         data_inicio: '13/05', data_fim: null },
  ],
}

// Status do chamado interno (pra cores na lista de histórico)
export const CHAMADO_STATUS_META = {
  aberto:        { label: 'Aberto',         cor: '#ea580c' },
  em_andamento:  { label: 'Em andamento',   cor: '#2563eb' },
  resolvido:     { label: 'Resolvido',      cor: '#16a34a' },
  nao_resolvido: { label: 'Não resolvido',  cor: '#dc2626' },
  aguardando:    { label: 'Aguardando',     cor: '#ca8a04' },
  agendado:      { label: 'Agendado',       cor: '#6366f1' },
}

export const MANUT_STATUS_META = {
  em_andamento:  { label: 'Em andamento',                       cor: '#ea580c' },
  finalizado:    { label: 'Finalizado',                         cor: '#16a34a' },
  nao_realizada: { label: 'Não foi possível realizar',          cor: '#dc2626' },
}

// Conta equipamentos por status
export function getResumoEquipamentos(equipamentos) {
  const c = { em_uso: 0, estoque: 0, em_manutencao: 0, descarte: 0 }
  for (const e of equipamentos) {
    if (e.status === STATUS.EM_USO)        c.em_uso++
    if (e.status === STATUS.ESTOQUE)       c.estoque++
    if (e.status === STATUS.EM_MANUTENCAO) c.em_manutencao++
    if (e.status === STATUS.DESCARTE)      c.descarte++
  }
  return c
}

// Lista única de unidades referenciadas no mock - pra alimentar o filtro
export function getUnidadesDistintas(equipamentos) {
  const set = new Set(equipamentos.map((e) => e.unidade).filter(Boolean))
  return Array.from(set).sort()
}
