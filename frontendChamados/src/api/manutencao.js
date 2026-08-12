import { apiFetch } from './client'

export const manutencaoApi = {
  listar:  (params)   => apiFetch('/manutencao/ordens/', { params }),
  criar:   (body)     => apiFetch('/manutencao/ordens/', { method: 'POST', body }),
  editar:  (id, body) => apiFetch(`/manutencao/ordens/${id}/`, { method: 'PATCH', body }),
  excluir: (id)       => apiFetch(`/manutencao/ordens/${id}/`, { method: 'DELETE' }),
}
