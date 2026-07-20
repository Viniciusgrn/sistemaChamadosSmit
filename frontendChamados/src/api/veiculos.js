import { apiFetch } from './client'

export const veiculosApi = {
  listar:   (params)     => apiFetch('/automovel/veiculos/', { params }),
  criar:    (body)       => apiFetch('/automovel/veiculos/', { method: 'POST', body }),
  editar:   (id, body)   => apiFetch(`/automovel/veiculos/${id}/`, { method: 'PATCH', body }),
  excluir:  (id)         => apiFetch(`/automovel/veiculos/${id}/`, { method: 'DELETE' }),

  // agendamentos (AgendaAutomovel)
  criarAgendamento: (body) => apiFetch('/automovel/agendamentos/', { method: 'POST', body }),
}
