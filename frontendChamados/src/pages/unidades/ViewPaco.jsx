import { useMemo, useState } from 'react'
import { ArrowLeft, Building2, Loader2, AlertCircle } from 'lucide-react'

import PlantaPaco from './PlantaPaco'
import { usePredios } from '../../hooks/useLocalidades'

const C = {
  bg:          '#f7f7f4',
  surface:     '#ffffff',
  surface2:    '#fbfaf7',
  hover:       '#f3f2ee',
  active:      '#eef0ff',
  border:      '#ececea',
  text1:       '#15161b',
  text2:       '#5b5e68',
  text3:       '#8b8d96',
  accent:      '#4f46e5',
  accentInk:   '#2d2783',
}

// Mostra a planta de um Predio (API). predioId obrigatório.
export default function ViewPaco({ predioId, onVoltar }) {
  const { data: predios = [], isLoading, isError } = usePredios()
  const predio = predios.find((p) => p.id === predioId) || predios[0] || null

  const plantas = predio?.plantas || []
  const [andarIx, setAndarIx] = useState(0)
  const [salaAtivaId, setSalaAtivaId] = useState(null)

  const plantaAtual = plantas[andarIx] || null

  // Salas do andar, ordenadas: ocupadas (com divisão) primeiro
  const salasDoAndar = useMemo(() => {
    const salas = [...(plantaAtual?.salas || [])]
    salas.sort((a, b) => {
      const na = a.divisao?.secretaria?.nome || a.label || ''
      const nb = b.divisao?.secretaria?.nome || b.label || ''
      return na.localeCompare(nb)
    })
    return salas
  }, [plantaAtual])

  const endereco = predio?.endereco

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onVoltar}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] transition-colors"
            style={{ color: C.text2 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            Voltar
          </button>

          <div className="text-[12px]" style={{ color: C.text3 }}>/</div>

          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.accent }} />
            <div className="min-w-0">
              <div className="text-[14px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
                {predio?.nome || 'Prédio'}
              </div>
              {endereco && (
                <div className="text-[11px] truncate" style={{ color: C.text2 }}>
                  {endereco.rua}, {endereco.numero} · {endereco.bairro?.nome}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seletor de andar */}
        {plantas.length > 0 && (
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-md"
            style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
          >
            {plantas.map((pl, ix) => (
              <button
                key={pl.id}
                onClick={() => { setAndarIx(ix); setSalaAtivaId(null) }}
                className="px-3 py-1 rounded text-[12px] font-medium transition-colors"
                style={
                  andarIx === ix
                    ? { backgroundColor: '#eef0ff', color: '#2d2783' }
                    : { backgroundColor: 'transparent', color: C.text2 }
                }
              >
                {pl.nome || `Andar ${pl.andar}`}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Conteúdo */}
      {isLoading ? (
        <Estado icon={Loader2} spin texto="Carregando planta…" />
      ) : isError || !predio ? (
        <Estado icon={AlertCircle} texto="Não foi possível carregar a planta do prédio." />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 min-w-0 overflow-auto">
            <PlantaPaco
              planta={plantaAtual}
              salaAtivaId={salaAtivaId}
              onHoverSala={setSalaAtivaId}
            />
          </div>

          <aside
            className="w-[360px] flex-shrink-0 overflow-y-auto flex flex-col"
            style={{ backgroundColor: C.surface, borderLeft: `1px solid ${C.border}` }}
          >
            <div
              className="px-4 py-3 sticky top-0 z-10"
              style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
            >
              <div className="text-[11px] uppercase tracking-wider" style={{ color: C.text3 }}>
                Salas do andar
              </div>
              <div className="text-[13px] font-medium mt-0.5" style={{ color: C.text1 }}>
                {salasDoAndar.length} {salasDoAndar.length === 1 ? 'sala' : 'salas'}
              </div>
            </div>

            <ul className="list-none p-0 m-0 flex-1">
              {salasDoAndar.map((sala) => {
                const ativo = sala.id === salaAtivaId
                const div = sala.divisao
                const cor = div?.secretaria?.cor || C.text3
                const titulo = div?.nome || sala.label || 'Sala sem ocupante'
                const sub = div?.secretaria?.nome || (div ? null : 'Espaço comum')
                return (
                  <li key={sala.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div
                      onMouseEnter={() => setSalaAtivaId(sala.id)}
                      onMouseLeave={() => setSalaAtivaId(null)}
                      className="px-4 py-3 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: ativo ? `${cor}14` : 'transparent',
                        borderLeft: `3px solid ${ativo ? cor : 'transparent'}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                        <span className="text-[13px] font-medium truncate" style={{ color: C.text1 }}>
                          {titulo}
                        </span>
                      </div>
                      {sub && (
                        <div className="text-[11px] mt-0.5 ml-4 truncate" style={{ color: C.text2 }}>
                          {sub}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
              {salasDoAndar.length === 0 && (
                <li className="px-4 py-6 text-center text-[12px]" style={{ color: C.text3 }}>
                  Nenhuma sala mapeada neste andar ainda.<br />
                  Cadastre salas no admin.
                </li>
              )}
            </ul>
          </aside>
        </div>
      )}
    </div>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: C.text3 }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px] max-w-xs text-center">{texto}</span>
    </div>
  )
}
