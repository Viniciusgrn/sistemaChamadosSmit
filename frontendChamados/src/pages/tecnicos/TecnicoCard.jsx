import { Building2, Briefcase } from 'lucide-react'
import { RESP_META, STATUS_META } from './data'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  border:   '#e3e2df',
  divider:  '#ececea',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
}

export default function TecnicoCard({ tecnico, onClick }) {
  const status = STATUS_META[tecnico.status]
  const resps = (tecnico.responsabilidades || []).map((id) => RESP_META[id])

  const iniciais = tecnico.nome_completo
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          onClick()
        }
      }}
      className="rounded-lg overflow-hidden cursor-pointer transition-all outline-none"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tecnico.cor
        e.currentTarget.style.boxShadow = `0 8px 20px -8px ${tecnico.cor}40, 0 1px 3px rgba(20,22,36,0.06)`
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(20,22,36,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Topo: avatar + nome + responsabilidade */}
      <div
        className="px-5 py-4 flex items-start gap-3"
        style={{
          backgroundImage: `linear-gradient(180deg, ${tecnico.cor}0d 0%, transparent 100%)`,
          borderBottom: `1px solid ${C.divider}`,
        }}
      >
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full inline-flex items-center justify-center text-[14px] font-semibold text-white leading-none"
          style={{
            backgroundColor: tecnico.cor,
            boxShadow: `0 4px 10px -2px ${tecnico.cor}55`,
          }}
        >
          {iniciais}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
            {tecnico.nome_completo}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {resps.map((r) => (
              <span
                key={r.label}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
                style={{
                  backgroundColor: `${r.cor}14`,
                  color: r.cor,
                  border: `1px solid ${r.cor}44`,
                }}
              >
                {r.label}
              </span>
            ))}
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
              style={{
                backgroundColor: status.bg,
                color: status.cor,
              }}
            >
              {status.label}
            </span>
          </div>
          <div className="text-[10px] mt-1.5 font-mono" style={{ color: C.text3 }}>
            {tecnico.matricula}
          </div>
        </div>
      </div>

      {/* Contexto atual (em qual equipe/lobby/folga) */}
      {tecnico.contexto && (
        <div
          className="px-5 py-2 text-[11px] flex items-center gap-1.5"
          style={{ color: C.text2, borderBottom: `1px solid ${C.divider}` }}
        >
          <Briefcase className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
          <span className="truncate">{tecnico.contexto.label}</span>
        </div>
      )}

      {/* Unidade + stats */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: C.text2 }}>
          <Building2 className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
          <span className="truncate">{tecnico.unidade}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]" style={{ color: C.text3 }}>
          <span>
            <span className="font-semibold" style={{ color: C.text1 }}>{tecnico.atendimentos_hoje}</span>
            {' hoje'}
          </span>
          <span>
            <span className="font-semibold" style={{ color: C.text1 }}>{tecnico.atendimentos_mes}</span>
            {' no mês'}
          </span>
        </div>
      </div>
    </li>
  )
}
