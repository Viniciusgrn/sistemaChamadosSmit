// Adapta Equipamento da API → shape da tabela/drawer.
// API: { id, patrimonio, numero_de_serie, marca, modelo, tipo, tipo_display,
//        status, status_display, unidade: { id, nome } | null }
// Componentes esperam: { ...equipamento, unidade: <nome string>, unidade_id }

export function adaptaEquipamento(e) {
  return {
    id: e.id,
    patrimonio: e.patrimonio,
    numero_de_serie: e.numero_de_serie,
    marca: e.marca,
    modelo: e.modelo,
    tipo: e.tipo,
    status: e.status,
    unidade: e.unidade?.nome || '-',
    unidade_id: e.unidade?.id ?? null,
  }
}
