// Adapta o retorno da API (lista de Unidade, cada uma com endereco+divisao
// aninhados) para o shape que os componentes esperam: lista de ENDEREÇOS,
// cada um com suas unidades agrupadas.
//
// API Unidade:
//   { id, nome, paco_municipal, endereco: { id, rua, numero, ponto_referencia,
//     latitude, longitude, bairro: { id, nome, rural } },
//     divisao: { id, nome, sigla, secretaria: { id, nome, sigla, cor } } }
//
// Shape dos componentes (MapaEnderecos, ListaEnderecos):
//   { id, rua, numero, ponto_referencia, latitude, longitude,
//     bairro: { nome, rural },
//     unidades: [ { id, nome, secretaria: { nome, sigla, cor }, secretaria_id } ] }

export function agrupaUnidadesPorEndereco(unidades) {
  const porEndereco = new Map()

  for (const u of unidades) {
    const end = u.endereco
    if (!end) continue

    if (!porEndereco.has(end.id)) {
      porEndereco.set(end.id, {
        id: end.id,
        rua: end.rua,
        numero: end.numero,
        cep: end.cep,
        ponto_referencia: end.ponto_referencia,
        // back manda Decimal como string - converte pra número pro Leaflet
        latitude: end.latitude != null ? Number(end.latitude) : null,
        longitude: end.longitude != null ? Number(end.longitude) : null,
        bairro: end.bairro
          ? { id: end.bairro.id, nome: end.bairro.nome, rural: end.bairro.rural }
          : null,
        unidades: [],
      })
    }

    const secretaria = u.divisao?.secretaria || null
    porEndereco.get(end.id).unidades.push({
      id: u.id,
      nome: u.nome,
      paco_municipal: u.paco_municipal,
      secretaria_id: secretaria?.id ?? null,
      secretaria: secretaria
        ? { id: secretaria.id, nome: secretaria.nome, sigla: secretaria.sigla, cor: secretaria.cor }
        : null,
    })
  }

  // só endereços com coordenadas aparecem no mapa
  return Array.from(porEndereco.values()).filter(
    (e) => e.latitude != null && e.longitude != null
  )
}
