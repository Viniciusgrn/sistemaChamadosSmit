import { apiFetch } from './client'

export const equipesApi = {
  listar:  (params)   => apiFetch('/equipes/formacoes/', { params }),
  criar:   (body)     => apiFetch('/equipes/formacoes/', { method: 'POST', body }),
  editar:  (id, body) => apiFetch(`/equipes/formacoes/${id}/`, { method: 'PATCH', body }),
  excluir: (id)       => apiFetch(`/equipes/formacoes/${id}/`, { method: 'DELETE' }),

  // ações do fluxo: lobby -> campo -> encerrada
  entrar:    (id, tecnico_id) => apiFetch(`/equipes/formacoes/${id}/entrar/`, { method: 'POST', body: { tecnico_id } }),
  sair:      (id, tecnico_id) => apiFetch(`/equipes/formacoes/${id}/sair/`, { method: 'POST', body: { tecnico_id } }),
  despachar: (id, chamado_id) => apiFetch(`/equipes/formacoes/${id}/despachar/`, { method: 'POST', body: { chamado_id } }),
  encerrar:  (id, body)       => apiFetch(`/equipes/formacoes/${id}/encerrar/`, { method: 'POST', body }),
}
