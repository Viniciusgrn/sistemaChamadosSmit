import { Car, Clock } from 'lucide-react'
import { MOTIVO_ENCERRAMENTO_META } from './data'

const C = {
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  border:    '#e3e2df',
  divider:   '#ececea',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
}

export default function EquipeHistoricoCard({ equipe }) {
  return (
    <li
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
            {equipe.tecnicos_nomes.join(' + ')}
          </div>
          <div className="flex items-center gap-3 text-[11px] mt-1" style={{ color: C.text2 }}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={1.75} />
              {equipe.iniciada_em} – {equipe.encerrada_em}
            </span>
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3" strokeWidth={1.75} />
              <span className="font-mono">{equipe.veiculo_placa}</span>
            </span>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
          style={{ backgroundColor: C.surface2, color: C.text2 }}
        >
          {equipe.atendimentos.length} {equipe.atendimentos.length === 1 ? 'atendimento' : 'atendimentos'}
        </span>
      </div>

      <ul
        className="list-none p-0 m-0 divide-y"
        style={{ borderTop: `1px solid ${C.divider}`, backgroundColor: C.surface2 }}
      >
        {equipe.atendimentos.map((at, i) => {
          const motivo = MOTIVO_ENCERRAMENTO_META[at.motivo_encerramento]
          return (
            <li
              key={i}
              className="px-6 py-2.5 flex items-center gap-3 text-[12px]"
              style={{ borderColor: C.divider, color: C.text2 }}
            >
              <span className="font-mono font-semibold flex-shrink-0" style={{ color: C.text1 }}>
                {at.codigo}
              </span>
              <span className="flex-1 truncate">{at.titulo}</span>
              {motivo && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
                  style={{ backgroundColor: `${motivo.cor}1a`, color: motivo.cor }}
                >
                  {motivo.label}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </li>
  )
}
