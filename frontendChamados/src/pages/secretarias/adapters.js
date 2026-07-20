// Monta a árvore Secretaria → Divisões → Unidades a partir das 3 listas da API.
// Shape de saída (consumido por SecretariaCard / SecretariaDrawer):
//   { id, nome, sigla, cor, secretario,
//     divisoes: [{ id, nome, sigla, unidades: [{ id, nome }] }],
//     qtd_divisoes, qtd_unidades }

export function montaSecretariasConsolidadas(secretarias, divisoes, unidades) {
  // unidades indexadas por divisao_id
  const unidPorDiv = new Map()
  for (const u of unidades) {
    const dId = u.divisao?.id
    if (dId == null) continue
    if (!unidPorDiv.has(dId)) unidPorDiv.set(dId, [])
    unidPorDiv.get(dId).push({ id: u.id, nome: u.nome })
  }

  // divisões indexadas por secretaria_id
  const divPorSec = new Map()
  for (const d of divisoes) {
    const sId = d.secretaria?.id
    if (sId == null) continue
    if (!divPorSec.has(sId)) divPorSec.set(sId, [])
    divPorSec.get(sId).push({
      id: d.id,
      nome: d.nome,
      sigla: d.sigla,
      unidades: unidPorDiv.get(d.id) || [],
    })
  }

  return secretarias.map((s) => {
    const divs = divPorSec.get(s.id) || []
    const qtdUnidades = divs.reduce((acc, d) => acc + d.unidades.length, 0)
    return {
      id: s.id,
      nome: s.nome,
      sigla: s.sigla,
      cor: s.cor,
      // FK Usuario - ainda não populado, vem como id ou null. Sem nome por ora.
      secretario: null,
      divisoes: divs,
      qtd_divisoes: divs.length,
      qtd_unidades: qtdUnidades,
    }
  })
}
