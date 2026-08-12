import { apiFetch } from './client'

export const chamadosApi = {
  listar:   (params)   => apiFetch('/chamados/tickets/', { params }),
  criar:    (body)     => apiFetch('/chamados/tickets/', { method: 'POST', body }),
  atualizar:(id, body) => apiFetch(`/chamados/tickets/${id}/`, { method: 'PATCH', body }),
  // solicitante só cancela enquanto o chamado está Aberto
  cancelar: (id)       => apiFetch(`/chamados/tickets/${id}/`, { method: 'PATCH', body: { status_chamado: 3 } }),
  // técnico assume o chamado; a equipe é criada sozinha se ele não tiver uma.
  // Trocando de chamado, `status_anterior` diz como fica o que ele larga.
  atender: (id, body = {}) =>
    apiFetch(`/chamados/tickets/${id}/atender/`, { method: 'POST', body }),
  // técnico sai do chamado dizendo em que status ele fica (sair ≠ resolver)
  encerrarAtendimento: (id, body) =>
    apiFetch(`/chamados/tickets/${id}/encerrar-atendimento/`, { method: 'POST', body }),
}
