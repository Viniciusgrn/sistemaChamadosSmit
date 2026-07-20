// Adapta Automovel da API → shape do VeiculoCard.
// API: { id, placa, marca, modelo, cor, status, assentos,
//        agendamentos_futuros: [{ id, data_agendamento, motivo, tipo_agendamento }],
//        equipe_atual: { integrantes, chamado_codigo } | null }
// Card espera: { ...veiculo, eventos: [{ id, data, motivo }], emCampo }

export function adaptaVeiculo(v) {
  return {
    id: v.id,
    placa: v.placa,
    marca: v.marca,
    modelo: v.modelo,
    cor: v.cor,
    status: v.status,
    assentos: v.assentos,
    emCampo: v.equipe_atual || null,
    eventos: (v.agendamentos_futuros || []).map((a) => ({
      id: a.id,
      data: a.data_agendamento,        // ISO completo; formatarData lida com isso
      motivo: a.motivo,
      tipo_agendamento: a.tipo_agendamento,
    })),
  }
}
