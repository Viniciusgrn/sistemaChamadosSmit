import { Car, Ticket, Users, Clock, History } from 'lucide-react'
import { resolveTecnico, resolveVeiculo, resolveChamado, nomeEquipe } from './data'

const C = {
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  border:    '#e3e2df',
  divider:   '#ececea',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  ativa:     '#dbeafe',
  ativaFg:   '#1e3a8a',
}

export default function EquipeAtivaCard({ equipe }) {
  const veiculo = resolveVeiculo(equipe.veiculo_id)
  const chamado = resolveChamado(equipe.chamado_atual_codigo)
  const tecnicos = equipe.tecnicos_ids.map(resolveTecnico).filter(Boolean)

  return (
    <li
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
      }}
    >

      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-2 flex-shrink-0">
            {tecnicos.map((t) => (
              <div
                key={t.id}
                className="w-9 h-9 rounded-full inline-flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0 leading-none"
                style={{ backgroundColor: t.cor, boxShadow: 'inset 0 0 0 2px #fff' }}
                title={t.nome_completo}
              >
                {t.primeiro_nome[0]}
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
              {nomeEquipe(tecnicos)}
            </div>
            <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: C.text2 }}>
              <Clock className="w-3 h-3" strokeWidth={1.75} />
              Iniciada às {equipe.iniciada_em}
            </div>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
          style={{ backgroundColor: C.ativa, color: C.ativaFg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563eb' }} />
          Em campo
        </span>
      </div>

      <div
        className="px-6 py-3 grid grid-cols-2 gap-4 text-[12px]"
        style={{ borderTop: `1px solid ${C.divider}`, color: C.text2 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Car className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
          {veiculo ? (
            <span className="truncate">
              <span className="font-mono font-semibold" style={{ color: C.text1 }}>{veiculo.placa}</span>
              {' · '}
              {veiculo.marca} {veiculo.modelo}
            </span>
          ) : (
            <span className="italic" style={{ color: C.text3 }}>sem veículo</span>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Ticket className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
          {chamado ? (
            <span className="truncate">
              <span className="font-mono font-semibold" style={{ color: C.text1 }}>{chamado.codigo}</span>
              {' · '}
              {chamado.titulo}
            </span>
          ) : (
            <span className="italic" style={{ color: C.text3 }}>sem chamado</span>
          )}
        </div>
      </div>

      <div
        className="px-6 py-2.5 flex items-center gap-2 text-[11px]"
        style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}`, color: C.text2 }}
      >
        <History className="w-3 h-3" strokeWidth={1.75} style={{ color: C.text3 }} />
        <span className="font-medium" style={{ color: C.text1 }}>{equipe.qtd_atendimentos_hoje}</span>
        atendimentos hoje
      </div>
    </li>
  )
}
