import { apiFetch } from './client'

export const ramaisApi = {
  listar:  (params)   => apiFetch('/ramal/ramais/', { params }),
  criar:   (body)     => apiFetch('/ramal/ramais/', { method: 'POST', body }),
  editar:  (id, body) => apiFetch(`/ramal/ramais/${id}/`, { method: 'PATCH', body }),
  excluir: (id)       => apiFetch(`/ramal/ramais/${id}/`, { method: 'DELETE' }),
}
