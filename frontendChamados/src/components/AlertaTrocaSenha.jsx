import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Faixa vermelha exibida enquanto o usuário estiver com a senha inicial.
// Some sozinha depois que ele trocar a senha no perfil.
export default function AlertaTrocaSenha() {
  const { user } = useAuth()
  if (!user?.precisa_trocar_senha) return null

  return (
    <Link
      to="/perfil"
      className="flex-shrink-0 flex items-center justify-center gap-2.5 px-4 py-2.5 text-[13px] font-bold tracking-wide no-underline transition-colors"
      style={{ backgroundColor: '#dc2626', color: '#fff' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" strokeWidth={2.25} />
      TROQUE SUA SENHA - você ainda está usando a senha inicial
      <ArrowRight className="w-4 h-4 flex-shrink-0" strokeWidth={2.25} />
    </Link>
  )
}
