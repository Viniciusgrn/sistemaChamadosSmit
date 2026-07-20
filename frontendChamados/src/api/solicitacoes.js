import { apiFetch } from './client'

export const solicitacoesApi = {
  listar:  (params) => apiFetch('/usuarios/solicitacoes-divisao/', { params }),
  criar:   (divisao_id) => apiFetch('/usuarios/solicitacoes-divisao/', { method: 'POST', body: { divisao_id } }),
  aprovar: (id) => apiFetch(`/usuarios/solicitacoes-divisao/${id}/aprovar/`, { method: 'POST' }),
  recusar: (id) => apiFetch(`/usuarios/solicitacoes-divisao/${id}/recusar/`, { method: 'POST' }),
}
