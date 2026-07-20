import { apiFetch } from './client'

export const equipamentosApi = {
  listar:  (params)     => apiFetch('/equipamento/ativos/', { params }),
  criar:   (body)       => apiFetch('/equipamento/ativos/', { method: 'POST', body }),
  editar:  (id, body)   => apiFetch(`/equipamento/ativos/${id}/`, { method: 'PATCH', body }),
  excluir: (id)         => apiFetch(`/equipamento/ativos/${id}/`, { method: 'DELETE' }),
}
