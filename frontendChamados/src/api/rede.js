import { apiFetch } from './client'

// Mapeamento de rede: área restrita à TI (o backend recusa até leitura de
// quem não opera o sistema). Tudo é consultado por unidade.
export const redeApi = {
  dispositivos:      (params)   => apiFetch('/rede/dispositivos/', { params }),
  criarDispositivo:  (body)     => apiFetch('/rede/dispositivos/', { method: 'POST', body }),
  editarDispositivo: (id, body) => apiFetch(`/rede/dispositivos/${id}/`, { method: 'PATCH', body }),
  excluirDispositivo:(id)       => apiFetch(`/rede/dispositivos/${id}/`, { method: 'DELETE' }),

  wifis:       (params)   => apiFetch('/rede/wifi/', { params }),
  criarWifi:   (body)     => apiFetch('/rede/wifi/', { method: 'POST', body }),
  editarWifi:  (id, body) => apiFetch(`/rede/wifi/${id}/`, { method: 'PATCH', body }),
  excluirWifi: (id)       => apiFetch(`/rede/wifi/${id}/`, { method: 'DELETE' }),
}
