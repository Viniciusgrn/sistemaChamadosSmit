import { Phone, ExternalLink } from 'lucide-react'
import { RESP_META } from './data'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  border:   '#e3e2df',
  divider:  '#ececea',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
}

export default function EmpresaCard({ empresa, onClick }) {
  const meta = RESP_META[empresa.responsabilidade]
  const Icone = meta.icon

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
        e.currentTarget.style.borderColor = meta.cor
        e.currentTarget.style.boxShadow = `0 8px 20px -8px ${meta.cor}40, 0 1px 3px rgba(20,22,36,0.06)`
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(20,22,36,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Topo: ícone + nome + badge da responsabilidade */}
      <div
        className="px-5 py-4 flex items-start gap-3"
        style={{
          backgroundImage: `linear-gradient(180deg, ${meta.cor}0d 0%, transparent 100%)`,
          borderBottom: `1px solid ${C.divider}`,
        }}
      >
        <div
          className="flex-shrink-0 w-11 h-11 rounded-md flex items-center justify-center"
          style={{
            backgroundColor: `${meta.cor}1a`,
            border: `1px solid ${meta.cor}44`,
          }}
        >
          <Icone className="w-5 h-5" strokeWidth={1.75} style={{ color: meta.cor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[14px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
              {empresa.nome}
            </div>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
              style={{
                backgroundColor: `${meta.cor}1a`,
                color: meta.cor,
                border: `1px solid ${meta.cor}44`,
              }}
            >
              {meta.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: C.text2 }}>
            <Phone className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
            <span className="truncate">{empresa.numero_telefone}</span>
          </div>

          {empresa.link_site ? (
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px]" style={{ color: C.text2 }}>
              <ExternalLink className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
              <span className="truncate">{empresa.link_site}</span>
            </div>
          ) : (
            <div className="text-[11px] italic mt-0.5" style={{ color: C.text3 }}>
              Sem site cadastrado
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div
        className="px-5 py-3 flex items-center justify-between text-[11px]"
        style={{ color: C.text2 }}
      >
        <span>
          <span className="font-semibold" style={{ color: empresa.qtd_ativos > 0 ? meta.cor : C.text1 }}>
            {empresa.qtd_ativos}
          </span>
          {' '}
          {empresa.qtd_ativos === 1 ? 'ativo' : 'ativos'}
        </span>
        <span style={{ color: C.text3 }}>
          {empresa.qtd_total} {empresa.qtd_total === 1 ? 'chamado no total' : 'chamados no total'}
        </span>
      </div>
    </li>
  )
}
