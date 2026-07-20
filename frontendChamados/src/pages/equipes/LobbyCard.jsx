import { Car, Ticket, AlertCircle, ArrowRight, Clock } from 'lucide-react'
import Slot from './Slot'
import { resolveTecnico, resolveVeiculo, resolveChamado, nomeEquipe } from './data'

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

const URGENCIA_META = {
  0: { label: 'Baixa',    cor: '#16a34a' },
  1: { label: 'Média',    cor: '#ca8a04' },
  2: { label: 'Alta',     cor: '#ea580c' },
  3: { label: 'Crítica',  cor: '#dc2626' },
}

 

export default function LobbyCard({ lobby, onEntrar, onSairCampo, onTrocarCarro, onTrocarChamado }) {

  function chamadoCriado(){
    if(lobby.criado_em!=0){
      console.log('AASADSADASDSDASDADDDDDDDD'+ lobby.criado_em)
      return lobby.criado_em
    } else {
      return "--"
    }
  } 
  
  const veiculo = resolveVeiculo(lobby.veiculo_id)
  const chamado = resolveChamado(lobby.chamado_codigo)
  const tecnicos = lobby.tecnicos_ids.map(resolveTecnico).filter(Boolean)
  const totalSlots = veiculo?.assentos ?? 0
  const slotsExibidos = totalSlots > 0
    ? Array.from({ length: totalSlots }).map((_, i) => tecnicos[i] || null)
    : []
  const comecoDaEquipe = chamadoCriado(lobby.criado_em)  
  const podeSair = tecnicos.length >= 1 && veiculo && chamado

  return (
    <li
      className="rounded-xl overflow-hidden animate-slide-in"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
        backgroundImage: 'linear-gradient(180deg, #fdfcfa 0%, #ffffff 56px)',
      }}
    >

      <div
        className="px-6 pt-5 pb-3 flex items-start justify-between gap-4"
      >
        <div className="flex flex-col gap-2 min-w-0 flex-1">

          <button
            onClick={() => onTrocarCarro?.(lobby)}
            className="flex items-center gap-2 text-left rounded-md px-2 py-1 -ml-2 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f2ee')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Trocar carro"
          >
            <Car className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text2 }} />
            {veiculo ? (
              <span className="text-[12px]">
                <span className="font-mono font-semibold" style={{ color: C.text1 }}>{veiculo.placa}</span>
                <span className="mx-1.5" style={{ color: C.text3 }}>·</span>
                <span style={{ color: C.text2 }}>
                  {veiculo.marca} {veiculo.modelo} ({veiculo.assentos} lug.)
                </span>
              </span>
            ) : (
              <span className="text-[12px] italic" style={{ color: C.text3 }}>
                Escolher carro
              </span>
            )}
          </button>

          <button
            onClick={() => onTrocarChamado?.(lobby)}
            className="flex items-center gap-2 text-left rounded-md px-2 py-1 -ml-2 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f2ee')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Trocar chamado"
          >
            <Ticket className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text2 }} />
            {chamado ? (
              <span className="text-[12px] flex items-center gap-1.5 min-w-0">
                <span className="font-mono font-semibold flex-shrink-0" style={{ color: C.text1 }}>
                  {chamado.codigo}
                </span>
                <span style={{ color: C.text3 }}>·</span>
                <span className="truncate" style={{ color: C.text2 }}>
                  {chamado.titulo}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider flex-shrink-0"
                  style={{
                    backgroundColor: `${URGENCIA_META[chamado.urgencia].cor}1a`,
                    color: URGENCIA_META[chamado.urgencia].cor,
                  }}
                >
                  {URGENCIA_META[chamado.urgencia].label}
                </span>
              </span>
            ) : (
              <span className="text-[12px] italic" style={{ color: C.text3 }}>
                Escolher chamado
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: C.text3 }}>
          <Clock className="w-3 h-3" strokeWidth={1.75} />
          desde ({comecoDaEquipe})
        </div>  
      </div>

      <div className="px-6 py-5" style={{ borderTop: `1px solid ${C.divider}` }}>
        {totalSlots === 0 ? (
          <div
            className="flex items-center justify-center gap-2 py-6 text-[12px]"
            style={{ color: C.text3, backgroundColor: C.surface2, borderRadius: 8 }}
          >
            <AlertCircle className="w-4 h-4" strokeWidth={1.75} />
            Escolha um carro pra liberar os assentos da equipe.
          </div>
        ) : (
          <div className="flex items-start justify-center gap-5 flex-wrap">
            {slotsExibidos.map((t, i) => (
              <Slot
                key={i}
                tecnico={t}
                onClick={() => onEntrar?.(lobby, i)}
              />
            ))}
          </div>
        )}

        {tecnicos.length > 0 && (
          <div className="text-[11px] text-center mt-3" style={{ color: C.text2 }}>
            <span className="font-semibold" style={{ color: C.text1 }}>
              {nomeEquipe(tecnicos)}
            </span>
            {' · '}
            <span style={{ color: C.text3 }}>
              {tecnicos.length}/{totalSlots} {tecnicos.length === 1 ? 'integrante' : 'integrantes'}
            </span>
          </div>
        )}
      </div>

      <div
        className="px-6 py-3 flex items-center justify-end gap-2"
        style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}` }}
      >
        <button
          onClick={() => podeSair && onSairCampo?.(lobby)}
          disabled={!podeSair}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: podeSair ? C.accent : '#d4d3cf',
            color: '#fff',
            cursor: podeSair ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => { if (podeSair) e.currentTarget.style.backgroundColor = C.accentInk }}
          onMouseLeave={(e) => { if (podeSair) e.currentTarget.style.backgroundColor = C.accent }}
          title={podeSair ? '' : 'Falta escolher carro, chamado e ao menos 1 integrante'}
        >
          Sair pra campo
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </li>
  )
}
