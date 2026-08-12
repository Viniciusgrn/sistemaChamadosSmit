// Erro da API pode vir como {detail: "..."} ou {campo: ["msg"]} — mostra o que veio.
// Vive aqui porque as telas de gestão e as de campo precisam da mesma tradução.
export function mensagemErro(e, padrao) {
  const d = e?.data
  if (!d) return padrao
  if (typeof d.detail === 'string') return d.detail
  const primeiro = Object.entries(d)[0]
  if (primeiro) {
    const [campo, msgs] = primeiro
    const texto = Array.isArray(msgs) ? msgs[0] : msgs
    return `${campo}: ${texto}`
  }
  return padrao
}
