import { apiFetch } from './client'

export const chamadosApi = {
  listar: (params) => apiFetch('/chamados/tickets/', { params }),
  criar:  (body)   => apiFetch('/chamados/tickets/', { method: 'POST', body }),
}
