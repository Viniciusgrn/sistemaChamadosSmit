import { useEffect } from "react"
import { X } from 'lucide-react'
import { TEAM_STATUS_META } from "../../pages/chamados/data"

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  hover:    '#f3f2ee',
  border:   '#ececea',
  border2:  '#e3e2df',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
}

export default function AssignModal({ ticket, teams, onClose, onPick }) {
  if (!ticket) return null

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        <div
          className="px-5 py-4 flex items-start justify-between gap-3"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Atribuir equipe
            </h3>
            <div className="text-[12px] mt-0.5 truncate" style={{ color: C.text2 }}>
              <span className="font-mono font-semibold">{ticket.code}</span> · {ticket.title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: C.text3 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul className="list-none p-0 m-0">
            {teams.map((t) => {
              const meta = TEAM_STATUS_META[t.status]
              const disabled = t.status === 'em_atendimento'
              return (
                <li key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <button
                    type="button"
                    onClick={() => !disabled && onPick(t)}
                    disabled={disabled}
                    className="w-full px-5 py-3 flex items-center gap-3 text-left transition-colors"
                    style={{
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = C.hover }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      {t.members.map((m) => (
                        <div
                          key={m.initials}
                          className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 leading-none"
                          style={{ backgroundColor: m.color, boxShadow: 'inset 0 0 0 2px #fff' }}
                        >
                          {m.initials}
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: C.text1 }}>
                        {t.name}
                        <span className="font-mono ml-1.5 text-[11px] font-normal" style={{ color: C.text3 }}>
                          · {t.id}
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: C.text2 }}>
                        {t.location}
                      </div>
                    </div>

                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
