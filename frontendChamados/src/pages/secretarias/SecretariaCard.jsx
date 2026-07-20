import { Building2, Layers, User } from 'lucide-react'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  border:   '#e3e2df',
  divider:  '#ececea',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
}

export default function SecretariaCard({ secretaria, onClick }) {
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
        e.currentTarget.style.borderColor = secretaria.cor
        e.currentTarget.style.boxShadow = `0 8px 20px -8px ${secretaria.cor}40, 0 1px 3px rgba(20,22,36,0.06)`
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(20,22,36,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Topo: sigla grande colorida */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          backgroundImage: `linear-gradient(180deg, ${secretaria.cor}0d 0%, transparent 100%)`,
          borderBottom: `1px solid ${C.divider}`,
        }}
      >
        <div
          className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center font-semibold tracking-tight"
          style={{
            backgroundColor: `${secretaria.cor}1a`,
            color: secretaria.cor,
            border: `1px solid ${secretaria.cor}44`,
            fontSize: secretaria.sigla.length > 3 ? '12px' : '15px',
          }}
        >
          {secretaria.sigla}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
            {secretaria.nome}
          </div>
          <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: C.text2 }}>
            <User className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
            {secretaria.secretario ? (
              <span className="truncate">{secretaria.secretario}</span>
            ) : (
              <span className="italic" style={{ color: C.text3 }}>Sem secretário definido</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 flex items-center gap-5 text-[11px]" style={{ color: C.text2 }}>
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3" strokeWidth={1.75} style={{ color: C.text3 }} />
          <span className="font-medium" style={{ color: C.text1 }}>{secretaria.qtd_divisoes}</span>
          {secretaria.qtd_divisoes === 1 ? 'divisão' : 'divisões'}
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3" strokeWidth={1.75} style={{ color: C.text3 }} />
          <span className="font-medium" style={{ color: C.text1 }}>{secretaria.qtd_unidades}</span>
          {secretaria.qtd_unidades === 1 ? 'unidade' : 'unidades'}
        </span>
      </div>
    </li>
  )
}
