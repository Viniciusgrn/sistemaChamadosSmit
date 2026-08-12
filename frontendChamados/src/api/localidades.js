// Fetch dos endpoints do app `unidade` (/api/localidades/).
import { apiFetch } from './client'

export const localidadesApi = {
  // ----- leitura -----
  secretarias: (params) => apiFetch('/localidades/secretarias/', { params }),
  divisoes:    (params) => apiFetch('/localidades/divisoes/', { params }),

  // CRUD de secretaria
  criarSecretaria:   (body)     => apiFetch('/localidades/secretarias/', { method: 'POST', body }),
  editarSecretaria:  (id, body) => apiFetch(`/localidades/secretarias/${id}/`, { method: 'PATCH', body }),
  excluirSecretaria: (id)       => apiFetch(`/localidades/secretarias/${id}/`, { method: 'DELETE' }),

  // CRUD de divisão
  criarDivisao:   (body)     => apiFetch('/localidades/divisoes/', { method: 'POST', body }),
  editarDivisao:  (id, body) => apiFetch(`/localidades/divisoes/${id}/`, { method: 'PATCH', body }),
  excluirDivisao: (id)       => apiFetch(`/localidades/divisoes/${id}/`, { method: 'DELETE' }),
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
