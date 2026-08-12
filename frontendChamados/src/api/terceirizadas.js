import { apiFetch } from './client'

export const terceirizadasApi = {
  // empresas
  listar:  (params)   => apiFetch('/terceirizada/empresas/', { params }),
  criar:   (body)     => apiFetch('/terceirizada/empresas/', { method: 'POST', body }),
  editar:  (id, body) => apiFetch(`/terceirizada/empresas/${id}/`, { method: 'PATCH', body }),
  excluir: (id)       => apiFetch(`/terceirizada/empresas/${id}/`, { method: 'DELETE' }),

  // chamados delegados (ChamadoTerceirizada)
  criarChamado:   (body)     => apiFetch('/terceirizada/chamados-externos/', { method: 'POST', body }),
  editarChamado:  (id, body) => apiFetch(`/terceirizada/chamados-externos/${id}/`, { method: 'PATCH', body }),
  excluirChamado: (id)       => apiFetch(`/terceirizada/chamados-externos/${id}/`, { method: 'DELETE' }),
}
