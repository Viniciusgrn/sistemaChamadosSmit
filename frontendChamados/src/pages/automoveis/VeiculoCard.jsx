import { Car, Calendar, Users, Pencil, Plus } from 'lucide-react'
import { STATUS, STATUS_META, COR_META, formatarData } from './data'

const C = {
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  border:    '#e3e2df',
  divider:   '#ececea',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

export default function VeiculoCard({ veiculo, onEditar, onAgendar }) {
  const status = STATUS_META[veiculo.status]
  const cor = COR_META[veiculo.cor]

  return (
    <li
      className="rounded-lg overflow-hidden transition-all"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#c8c7c3'
        e.currentTarget.style.boxShadow = '0 4px 12px -4px rgba(20,22,36,0.08), 0 1px 3px rgba(20,22,36,0.06)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(20,22,36,0.04)'
      }}
    >
      <div className="px-7 py-5 flex items-center gap-4">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-md flex items-center justify-center"
          style={{ backgroundColor: '#eef0ff' }}
        >
          <Car className="w-7 h-7" strokeWidth={1.5} style={{ color: C.accent }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-mono text-[17px] font-semibold tracking-tight"
              style={{ color: C.text1 }}
            >
              {veiculo.placa}
            </span>
            <StatusBadge meta={status} />
          </div>

          <div className="flex items-center gap-2 mt-1 text-[12px]" style={{ color: C.text2 }}>
            <span>{veiculo.marca} {veiculo.modelo}</span>
            <span style={{ color: C.text3 }}>·</span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: cor.hex, border: `1px solid ${cor.borda}` }}
              />
              {cor.label}
            </span>
          </div>
        </div>
      </div>

      {veiculo.status === STATUS.EM_USO && veiculo.emCampo && (
        <div
          className="px-7 py-3 flex items-center gap-2 text-[12px]"
          style={{ backgroundColor: '#dbeafe', borderTop: `1px solid ${C.divider}` }}
        >
          <Users className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: '#1e3a8a' }} />
          <span style={{ color: '#1e3a8a' }}>
            Em campo com{' '}
            <strong className="font-semibold">
              {veiculo.emCampo.integrantes.join(' + ')}
            </strong>
            {veiculo.emCampo.chamado_codigo && (
              <>
                {' · '}
                <span className="font-mono">{veiculo.emCampo.chamado_codigo}</span>
              </>
            )}
          </span>
        </div>
      )}

      <div className="px-7 py-4" style={{ borderTop: `1px solid ${C.divider}` }}>
        <div
          className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5"
          style={{ color: C.text3 }}
        >
          <Calendar className="w-3 h-3" strokeWidth={1.75} />
          Próximos eventos
        </div>

        {veiculo.eventos.length === 0 ? (
          <div className="text-[12px] italic" style={{ color: C.text3 }}>
            Nenhum agendamento futuro.
          </div>
        ) : (
          <ul className="list-none p-0 m-0 space-y-1">
            {veiculo.eventos.slice(0, 5).map((ev) => (
              <li
                key={ev.id}
                className="flex items-baseline gap-2 text-[12px]"
                style={{ color: C.text2 }}
              >
                <span
                  className="font-mono font-medium flex-shrink-0"
                  style={{ color: C.text1 }}
                >
                  {formatarData(ev.data)}
                </span>
                <span style={{ color: C.text3 }}>·</span>
                <span className="truncate">{ev.motivo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="px-7 py-3 flex items-center justify-end gap-2"
        style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}` }}
      >
        <button
          onClick={() => onEditar?.(veiculo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors"
          style={{ color: C.text2, backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f2ee'; e.currentTarget.style.color = C.text1 }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
          Editar veículo
        </button>
        <button
          onClick={() => onAgendar?.(veiculo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
          style={{ backgroundColor: C.accent, color: '#fff' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Agendar evento
        </button>
      </div>
    </li>
  )
}

function StatusBadge({ meta }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight"
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: meta.dot }}
      />
      {meta.label}
    </span>
  )
}
