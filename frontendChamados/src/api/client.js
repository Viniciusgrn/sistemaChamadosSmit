// Cliente HTTP central. Todas as chamadas mandam o cookie de sessão
// (credentials: 'include') pra autenticar via SessionAuthentication do DRF.
// CORS no back já libera localhost:5173/5174 com credentials.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Lê o cookie csrftoken (necessário em POST/PUT/DELETE com SessionAuth)
function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export class ApiError extends Error {
  constructor(status, data) {
    super(`API ${status}`)
    this.status = status
    this.data = data
  }
}

export async function apiFetch(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE_URL}${path}`

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
    ).toString()
    if (qs) url += `?${qs}`
  }

  // FormData (upload de arquivo) vai como está, e SEM Content-Type manual:
  // o navegador precisa gerar o boundary do multipart sozinho
  const ehFormData = body instanceof FormData
  const headers = ehFormData ? {} : { 'Content-Type': 'application/json' }
  const metodoUnsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  if (metodoUnsafe) {
    const csrf = getCsrfToken()
    if (csrf) headers['X-CSRFToken'] = csrf
  }

  const resp = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: ehFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  let data = null
  const texto = await resp.text()
  if (texto) {
    try { data = JSON.parse(texto) } catch { data = texto }
  }

  if (!resp.ok) throw new ApiError(resp.status, data)
  return data
}

// Busca um arquivo autenticado (cookie de sessão) e devolve uma URL de blob
// local — serve pra exibir num iframe ou baixar. Link direto não funciona:
// em dev a API está em outra origem, e em produção o endpoint exige a sessão.
// Quem chamar deve revogar a URL (URL.revokeObjectURL) quando terminar.
export async function apiBlobUrl(path) {
  const resp = await fetch(`${BASE_URL}${path}`, { credentials: 'include' })
  if (!resp.ok) throw new ApiError(resp.status, null)
  return URL.createObjectURL(await resp.blob())
}

// Dispara o "salvar como" do navegador pro arquivo autenticado.
export async function apiDownload(path, nomeArquivo) {
  const url = await apiBlobUrl(path)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
