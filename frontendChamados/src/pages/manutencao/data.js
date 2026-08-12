// Enums/metadata espelhados do back. Dados reais via useManutencoes (API):
//   GET /api/manutencao/ordens/
//
// Regras de Manutenção (validadas no backend):
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

// Destino do equipamento ao encerrar a ordem (mirror de Equipamento.status).
// Nem toda manutenção devolve o equipamento pro uso.
export const DESTINO_META = {
  0: { label: 'Volta ao uso', cor: '#16a34a' },
  1: { label: 'Estoque',      cor: '#0891b2' },
  3: { label: 'Descarte',     cor: '#dc2626' },
}

// Tipos de equipamento (mirror de /equipamentos/data.js)
export const TIPO_EQ = {
  IMPRESSORA: 0,
  COMPUTADOR: 1,
  MONITOR:    2,
  TELEFONE:   3,
}

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
