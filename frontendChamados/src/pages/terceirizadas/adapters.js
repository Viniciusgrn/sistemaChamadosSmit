// Adapta EmpresaTerceirizada da API → shape dos cards/drawer.
// API: { id, nome, numero_telefone, link_site, responsabilidade,
//        responsabilidade_display, qtd_total, qtd_ativos,
//        chamados: [{ id, titulo, protocolo, status, status_display,
//                     chamado_interno, aberto_em, finalizado_em }] }

export function adaptaEmpresa(e) {
  return {
    id: e.id,
    nome: e.nome,
    numero_telefone: e.numero_telefone,
    link_site: e.link_site || null,
    responsabilidade: e.responsabilidade,
    chamados: e.chamados || [],
    qtd_ativos: e.qtd_ativos ?? 0,
    qtd_total: e.qtd_total ?? (e.chamados?.length || 0),
  }
}
