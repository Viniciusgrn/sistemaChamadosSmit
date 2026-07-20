import { useAuth } from '../contexts/AuthContext'

export default function DevPerfilToggle() {
  if (!import.meta.env.DEV) return null

  const { mockPerfil, setMockPerfil } = useAuth()

  const perfis = ['despachante', 'tecnico', 'solicitante']

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium shadow-lg"
      style={{ backgroundColor: '#0d1f2d', border: '1px solid #1e3a4a' }}
    >
      <span className="px-1 text-slate-500 uppercase tracking-wider text-[9px]">dev</span>
      {perfis.map((p) => (
        <button
          key={p}
          onClick={() => setMockPerfil(p)}
          className={`rounded px-2 py-0.5 transition-colors ${
            mockPerfil === p
              ? 'bg-[#1a3d3a] text-[#7fb89e]'
              : 'text-slate-400 hover:bg-[#14293a] hover:text-slate-200'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
