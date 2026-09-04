import { apiFetch, apiDownload } from './client'

// Guardador de documentos da TI (área restrita, como o mapeamento de rede).
// Upload é multipart: nome + PDF.
export const documentosApi = {
  listar: (params) => apiFetch('/documentos/arquivos/', { params }),

  enviar: ({ nome, arquivo }) => {
    const form = new FormData()
    form.append('nome', nome)
    form.append('arquivo', arquivo)
    return apiFetch('/documentos/arquivos/', { method: 'POST', body: form })
  },

  excluir: (id) => apiFetch(`/documentos/arquivos/${id}/`, { method: 'DELETE' }),

  baixar: (id, nome) =>
    apiDownload(`/documentos/arquivos/${id}/download/`, nome.toLowerCase().endsWith('.pdf') ? nome : `${nome}.pdf`),
}
