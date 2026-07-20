// Fetch dos endpoints do app `unidade` (/api/localidades/).
import { apiFetch } from './client'

export const localidadesApi = {
  // ----- leitura -----
  secretarias: (params) => apiFetch('/localidades/secretarias/', { params }),
  divisoes:    (params) => apiFetch('/localidades/divisoes/', { params }),
  bairros:     (params) => apiFetch('/localidades/bairros/', { params }),
  enderecos:   (params) => apiFetch('/localidades/enderecos/', { params }),
  unidades:    (params) => apiFetch('/localidades/unidades/', { params }),
  unidadesProximas: (lat, lng, limite = 5) =>
    apiFetch('/localidades/unidades/proximas/', { params: { lat, lng, limite } }),
  predios:     (params) => apiFetch('/localidades/predios/', { params }),

  // ----- escrita (endereço) -----
  criarEndereco:   (body)      => apiFetch('/localidades/enderecos/', { method: 'POST', body }),
  editarEndereco:  (id, body)  => apiFetch(`/localidades/enderecos/${id}/`, { method: 'PATCH', body }),
  excluirEndereco: (id)        => apiFetch(`/localidades/enderecos/${id}/`, { method: 'DELETE' }),
}
