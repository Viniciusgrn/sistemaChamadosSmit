import { apiFetch } from './client'

export const tecnicosApi = {
  listar:  (params)   => apiFetch('/equipes/profissionais/', { params }),
  // histórico de atendimentos do técnico (via equipes de que participou)
  historico: (id)     => apiFetch('/equipes/historico-atendimentos/', { params: { tecnico: id } }),
  criar:   (body)     => apiFetch('/equipes/profissionais/', { method: 'POST', body }),
  editar:  (id, body) => apiFetch(`/equipes/profissionais/${id}/`, { method: 'PATCH', body }),
  excluir: (id)       => apiFetch(`/equipes/profissionais/${id}/`, { method: 'DELETE' }),
}
