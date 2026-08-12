import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const C = {
  navy:     '#0d1f2d',
  navy2:    '#14293a',
  bg:       '#f7f7f4',
  surface:  '#ffffff',
  border:   '#e3e2df',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  accentInk:'#2d2783',
  erro:     '#dc2626',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const pode = username.trim() && password
  const carregando = login.isPending
  const erro = login.error

  const submit = (e) => {
    e.preventDefault()
    if (!pode || carregando) return
    // manda pra raiz: cada perfil resolve daí pros seus chamados
    // (DIT vai pra /chamados, solicitante abre o portal já na lista dele)
    login.mutate(
      { username: username.trim(), password },
      { onSuccess: () => navigate('/', { replace: true }) }
    )
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: C.navy }}
    >
      <div className="flex items-center gap-4 mb-7">
        <img
          src="/brasaoBraganca.png"
          alt="Brasão de Bragança Paulista"
          className="w-14 h-14 object-contain flex-shrink-0"
          draggable={false}
        />
        <div>
          <div className="text-[22px] font-semibold tracking-tight text-white leading-tight">
            Sistema de Chamados
          </div>
          <div className="text-[14px] text-slate-400">Prefeitura de Bragança Paulista</div>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg p-8"
        style={{
          backgroundColor: C.surface,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4)',
        }}
      >
          <h1 className="m-0 text-[19px] font-semibold tracking-tight" style={{ color: C.text1 }}>
            Entrar
          </h1>
          <p className="text-[12px] mt-1 mb-6" style={{ color: C.text2 }}>
            Use o mesmo usuário e senha do computador (rede).
          </p>

          <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
            Usuário
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex: jsilva"
            autoFocus
            autoComplete="username"
            className="w-full px-3 py-2.5 text-[13px] rounded-md focus:outline-none mb-4"
            style={{ backgroundColor: '#fbfaf7', border: `1px solid ${C.border}`, color: C.text1 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />

          <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-3 py-2.5 text-[13px] rounded-md focus:outline-none"
            style={{ backgroundColor: '#fbfaf7', border: `1px solid ${C.border}`, color: C.text1 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />

          {erro && (
            <div
              className="mt-4 text-[12px] px-3 py-2 rounded-md"
              style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}
            >
              {erro.status === 401
                ? 'Usuário ou senha inválidos.'
                : `Erro ao entrar${erro.status ? ` (${erro.status})` : ''}. Tente novamente.`}
            </div>
          )}

          <button
            type="submit"
            disabled={!pode || carregando}
            className="mt-6 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors"
            style={{
              backgroundColor: pode && !carregando ? C.accent : '#c7c5d9',
              color: '#fff',
              cursor: pode && !carregando ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => { if (pode && !carregando) e.currentTarget.style.backgroundColor = C.accentInk }}
            onMouseLeave={(e) => { if (pode && !carregando) e.currentTarget.style.backgroundColor = C.accent }}
          >
            {carregando
              ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              : <LogIn className="w-4 h-4" strokeWidth={1.75} />}
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
      </form>
    </div>
  )
}
