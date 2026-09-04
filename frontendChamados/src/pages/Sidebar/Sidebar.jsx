import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Ticket,
  Wrench,
  Package,
  Car,
  Building2,
  Users,
  UsersRound,
  Landmark,
  Briefcase,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  BookAlert,
  Phone,
  UserPlus,
  Network,
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'

const C = {
  bg: '#0d1f2d',
  bgHover: '#14293a',
  border: '#1e3a4a',
  borderSubtle: '#14293a',
  accent: '#7fb89e',
  accentBg: '#1a3d3a',
}

const navGroups = [
  {
    label: 'Operação',
    items: [
      { to: '/chamados',   label: 'Chamados',   icon: BookAlert },
      { to: '/manutencao', label: 'Manutenção', icon: Wrench },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/equipamentos', label: 'Equipamentos', icon: Package },
      { to: '/rede',         label: 'Rede',         icon: Network },
      { to: '/ramais',       label: 'Ramais',       icon: Phone },
      { to: '/automoveis',   label: 'Automóveis',   icon: Car },
      { to: '/unidades',     label: 'Unidades',     icon: Building2 },
    ],
  },
  {
    label: 'Pessoas',
    items: [
      { to: '/tecnicos', label: 'Técnicos', icon: Users },
      { to: '/equipes',  label: 'Equipes',  icon: UsersRound },
      { to: '/solicitacoes', label: 'Solicitações', icon: UserPlus },
    ],
  },
  {
    label: 'Organização',
    items: [
      { to: '/secretarias',   label: 'Secretarias',           icon: Landmark },
      { to: '/terceirizadas', label: 'Empresas Terceirizadas', icon: Briefcase },
    ],
  },
]

const scrollbarStyles = `
  .sidebar-scroll::-webkit-scrollbar { width: 6px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
    transition: background-color 0.2s;
  }
  .sidebar-scroll:hover::-webkit-scrollbar-thumb { background-color: #1e3a4a; }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover { background-color: #7fb89e; }
  .sidebar-scroll {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  .sidebar-scroll:hover { scrollbar-color: #1e3a4a transparent; }
`

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile
}

export default function Sidebar() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  useEffect(() => {
    if (!isMobile) setMobileOpen(false)
  }, [isMobile])

  const closeMobileOnNav = () => {
    if (isMobile) setMobileOpen(false)
  }

  const effectiveCollapsed = !isMobile && collapsed

  const userInitial = (user?.nome_completo || '?').charAt(0).toUpperCase()
  const userDisplay = user?.nome_completo?.split(' ')[0] || 'Usuário'

  return (
    <>
      <style>{scrollbarStyles}</style>

      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 w-10 h-10 rounded-md flex items-center justify-center text-slate-200 transition-colors"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" strokeWidth={1.75} />
      </button>

      <div
        onClick={() => setMobileOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <aside
        className={`
          flex flex-col h-screen z-50
          transition-all duration-300 ease-out
          md:relative md:translate-x-0
          fixed top-0 left-0
          ${isMobile ? 'w-[280px]' : effectiveCollapsed ? 'w-[72px]' : 'w-[248px]'}
          ${isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
        style={{ backgroundColor: C.bg, borderRight: `1px solid ${C.borderSubtle}` }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-8 z-50 w-6 h-6 rounded-full items-center justify-center text-slate-400 transition-colors duration-200"
          style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            className={`w-3 h-3 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute right-3 top-5 z-10 w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="px-5 pt-7 pb-8 flex-shrink-0 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: C.accentBg }}
            >
              {/* caminho a partir da raiz: o que está em public/ é servido em
                  /, e caminho relativo aqui quebraria conforme a rota aberta */}
              <img
                src="/brasaoBraganca.png"
                alt="Brasão de Bragança Paulista"
                className="w-6 h-6 object-contain"
              />
            </div>
            {!effectiveCollapsed && (
              <div className="overflow-hidden min-w-0">
                <div className="text-[13px] font-medium tracking-tight text-slate-100 truncate">
                  Sistema de Chamados
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-7">
              {!effectiveCollapsed && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-600 truncate">
                  {group.label}
                </div>
              )}
              <ul className="space-y-px list-none p-0 m-0">
                {group.items.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    onNavigate={closeMobileOnNav}
                    collapsed={effectiveCollapsed}
                    isMobile={isMobile}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="p-3 flex-shrink-0 overflow-hidden"
          style={{ borderTop: `1px solid ${C.borderSubtle}` }}
        >
          <div
            className="group flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer min-w-0"
            onClick={() => navigate('/perfil')}
            title="Meu perfil"
            onMouseEnter={(e) => {
              if (!isMobile) e.currentTarget.style.backgroundColor = C.bgHover
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium"
                style={{ backgroundColor: C.accentBg, color: C.accent }}
              >
                {userInitial}
              </div>
            </div>
            {!effectiveCollapsed && (
              <>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-[13px] font-medium text-slate-100 truncate">
                    {userDisplay}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {user?.username || '-'}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); logout.mutate() }}
                  className={`text-slate-500 hover:text-slate-300 transition-opacity flex-shrink-0 ${
                    isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function NavItem({ item, onNavigate, collapsed, isMobile }) {
  const Icon = item.icon

  return (
    <li className="list-none">
      <NavLink
        to={item.to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group relative w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-md text-[13px] transition-colors duration-150 min-w-0 no-underline ${
            isActive
              ? 'text-slate-50'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#14293a]'
          }`
        }
        style={({ isActive }) => ({
          backgroundColor: isActive ? C.accentBg : undefined,
        })}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                style={{ backgroundColor: C.accent }}
              />
            )}

            <Icon
              className="w-4 h-4 flex-shrink-0"
              strokeWidth={1.75}
              style={isActive ? { color: C.accent } : undefined}
            />

            {!collapsed && (
              <span className="flex-1 text-left truncate min-w-0">{item.label}</span>
            )}

            {collapsed && !isMobile && (
              <div
                className="absolute left-full ml-3 px-2.5 py-1.5 rounded text-xs text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50"
                style={{ backgroundColor: C.bgHover, border: `1px solid ${C.border}` }}
              >
                {item.label}
              </div>
            )}
          </>
        )}
      </NavLink>
    </li>
  )
}
