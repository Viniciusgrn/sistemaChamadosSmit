// Diretório de ramais do PABX - dados reais via useRamais (API).
//   GET /api/ramal/ramais/
// Shape da API: { id, numero, setor, ocupante, vago, divisao }

export function getResumo(ramais) {
  const vagos = ramais.filter((r) => r.vago).length
  return {
    total:    ramais.length,
    ocupados: ramais.length - vagos,
    vagos,
    setores:  new Set(ramais.map((r) => r.setor).filter(Boolean)).size,
  }
}

export function getSetoresDistintos(ramais) {
  return Array.from(new Set(ramais.map((r) => r.setor).filter(Boolean))).sort()
}
