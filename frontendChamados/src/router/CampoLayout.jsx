import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookAlert, Wrench, Package, Phone, Car, Building2, Users, UsersRound,
  Briefcase, Menu, X, LogOut, User, Navigation,
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import AlertaTrocaSenha from '../components/AlertaTrocaSenha'

const C = {
  bg:       '#f7f7f4',
  surface:  '#ffffff',
  border:   '#e3e2df',
  divider:  '#ececea',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  navy:     '#0d1f2d',
}

// As 4 telas do dia a dia ficam na barra de baixo, ao alcance do polegar.
// O resto é consulta e mora na gaveta.
const BARRA = [
  { to: '/chamado-atual', label: 'Atual',     icon: Navigation },
  { to: '/chamados',      label: 'Chamados',  icon: BookAlert },
  { to: '/equipes',       label: 'Equipes',   icon: UsersRound },
  { to: '/manutencao',    label: 'Manutenção', icon: Wrench },
]

const GAVETA = [
  {
    label: 'Operação',
    items: [
      { to: '/chamado-atual', label: 'Chamado atual', icon: Navigation },
      { to: '/chamados',      label: 'Chamados',      icon: BookAlert },
      { to: '/manutencao',    label: 'Manutenção',    icon: Wrench },
    ],
  },
  {
    label: 'Consulta',
    items: [
      { to: '/equipamentos', label: 'Equipamentos', icon: Package },
      { to: '/ramais',       label: 'Ramais',       icon: Phone },
      { to: '/automoveis',   label: 'Automóveis',   icon: Car },
      { to: '/unidades',     label: 'Unidades',     icon: Building2 },
    ],
  },
  {
    label: 'Pessoas',
    items: [
      { to: '/tecnicos',      label: 'Técnicos', icon: Users },
      { to: '/equipes',       label: 'Equipes',  icon: UsersRound },
      { to: '/terceirizadas', label: 'Empresas Terceirizadas', icon: Briefcase },
    ],
  },
]

export default function CampoLayout() {
  const [gaveta, setGaveta] = useState(false)
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const ehAprendiz = user?.perfil === 'aprendiz'

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ backgroundColor: C.bg }}>
      {/* Topo compacto: no celular cada pixel de altura conta */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 h-14"
        style={{ backgroundColor: C.navy, color: '#fff' }}
      >
        <img src="/brasaoBraganca.png" alt="" className="w-7 h-7 object-contain flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-tight truncate">
            {user?.nome_completo}
          </div>
          <div className="text-[11px] leading-tight truncate" style={{ color: '#9fb3c8' }}>
            {user?.cargo || 'Técnico'}
            {ehAprendiz && ' · acompanha equipe'}
          </div>
        </div>
        <button
          onClick={() => setGaveta(true)}
          className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <AlertaTrocaSenha />
        <Outlet />
      </main>

      {/* Barra inferior — alvos de 56px, acima do polegar, com safe-area do iOS */}
      <nav
        className="flex-shrink-0 flex items-stretch"
        style={{
          backgroundColor: C.surface,
          borderTop: `1px solid ${C.border}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {BARRA.map(({ to, label, icon: Icon }) => {
          const ativo = pathname === to || pathname.startsWith(`${to}/`)
          return (
            <NavLink
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px]"
              style={{ color: ativo ? C.accent : C.text3 }}
            >
              <Icon className="w-5 h-5" strokeWidth={ativo ? 2 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {gaveta && <Gaveta onFechar={() => setGaveta(false)} onSair={() => logout.mutate()} />}
    </div>
  )
}

function Gaveta({ onFechar, onSair }) {
  return (
    <div className="fixed inset-0 z-[400] flex justify-end">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20,22,36,0.45)' }}
        onClick={onFechar}
      />
      <div
        className="relative w-[280px] max-w-[85vw] h-full overflow-y-auto animate-slide-in"
        style={{ backgroundColor: C.surface, boxShadow: '-8px 0 24px -8px rgba(20,22,36,0.2)' }}
      >
        <div
          className="sticky top-0 flex items-center justify-between px-4 h-14"
          style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.divider}` }}
        >
          <span className="text-[13px] font-semibold" style={{ color: C.text1 }}>Menu</span>
          <button
            onClick={onFechar}
            className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center"
            style={{ color: C.text3 }}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {GAVETA.map((grupo) => (
          <div key={grupo.label} className="py-2">
            <div
              className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-medium"
              style={{ color: C.text3 }}
            >
              {grupo.label}
            </div>
            {grupo.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={`${grupo.label}-${to}`}
                to={to}
                onClick={onFechar}
                className="flex items-center gap-3 px-4 min-h-[48px] text-[13px]"
                style={({ isActive }) => ({
                  color: isActive ? C.accent : C.text1,
                  backgroundColor: isActive ? '#eef0ff' : 'transparent',
                })}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="py-2" style={{ borderTop: `1px solid ${C.divider}` }}>
          <NavLink
            to="/perfil"
            onClick={onFechar}
            className="flex items-center gap-3 px-4 min-h-[48px] text-[13px]"
            style={{ color: C.text1 }}
          >
            <User className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
            Meu perfil
          </NavLink>
          <button
            onClick={onSair}
            className="w-full flex items-center gap-3 px-4 min-h-[48px] text-[13px] text-left"
            style={{ color: '#b91c1c' }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
