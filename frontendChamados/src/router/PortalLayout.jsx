import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogOut, UserCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AlertaTrocaSenha from '../components/AlertaTrocaSenha'

// Layout do portal do solicitante (quem não é da DIT): topbar simples,
// sem a sidebar administrativa.
export default function PortalLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-2.5"
        style={{ backgroundColor: '#0d1f2d' }}
      >
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          {/* caminho a partir da raiz: public/ é servido em /, igual à Sidebar */}
          <img
            src="/brasaoBraganca.png"
            alt="Brasão de Bragança Paulista"
            className="w-7 h-7 object-contain"
          />
          <span className="text-[13px] font-semibold text-white tracking-tight">
            Sistema de Chamados
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink
            to="/perfil"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] no-underline transition-colors"
            style={({ isActive }) => ({
              color: isActive ? '#fff' : '#94a3b8',
              backgroundColor: isActive ? '#14293a' : 'transparent',
            })}
          >
            <UserCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            {user?.nome_completo?.split(' ')[0] || 'Perfil'}
          </NavLink>
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] text-slate-400 hover:text-slate-100 transition-colors"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      </header>

      <AlertaTrocaSenha />

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
