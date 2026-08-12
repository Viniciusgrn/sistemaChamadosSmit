// Adapta Manutencao da API -> shape que os cards/drawer consomem.

function dataCurta(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function adaptaManutencao(m) {
  const eq = m.equipamento_info || {}
  return {
    id: m.id,
    status: m.status,
    diagnostico: m.diagnostico || '',
    servico_executado: m.servico_executado || null,
    localizacao_atual: m.localizacao_atual_equipamento || '',

    equipamento: {
      id: eq.id,
      patrimonio: eq.patrimonio,
      marca: eq.marca,
      modelo: eq.modelo,
      tipo: eq.tipo,
      tipo_display: eq.tipo_display,
      unidade: eq.unidade,
    },

    chamado: m.chamado_info || null,
    chamado_codigo: m.chamado_info ? `#${m.chamado_info.id}` : null,

    backup: !!m.backup,
    backup_data: dataCurta(m.backup_data),
    backup_feito_por: m.backup_feito_por_nome || null,

    iniciada_em: dataCurta(m.iniciada_em),
    concluida_em: dataCurta(m.concluida_em),

    tecnicos: (m.tecnicos_info || []).map((t) => ({
      id: t.id,
      primeiro_nome: t.primeiro_nome,
      nome_completo: t.nome_completo,
      cor: t.cor,
    })),

    // guarda o cru pro modal de edição
    _raw: m,
  }
}
