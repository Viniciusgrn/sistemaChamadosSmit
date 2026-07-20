import { Building2, ArrowRight, Layers, Loader2, AlertCircle } from 'lucide-react'
import { usePredios } from '../../hooks/useLocalidades'

const C = {
  bg:        '#f7f7f4',
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  hover:     '#f3f2ee',
  border:    '#e3e2df',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

function resumoPredio(p) {
  const plantas = p.plantas || []
  const salas = plantas.reduce((acc, pl) => acc + (pl.salas?.length || 0), 0)
  const secretariasIds = new Set()
  plantas.forEach((pl) =>
    (pl.salas || []).forEach((s) => {
      const sec = s.divisao?.secretaria
      if (sec?.sigla) secretariasIds.add(sec.sigla)
    })
  )
  const e = p.endereco
  return {
    qtd_andares: plantas.length,
    qtd_salas: salas,
    qtd_secretarias: secretariasIds.size,
    endereco: e ? `${e.rua}, ${e.numero || 's/n'} · ${e.bairro?.nome || ''}` : '',
  }
}

export default function AbaPredios({ onAbrir }) {
  const { data: predios = [], isLoading, isError } = usePredios()

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: C.bg }}>
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <Estado icon={Loader2} spin texto="Carregando prédios…" />
        ) : isError ? (
          <Estado icon={AlertCircle} texto="Erro ao carregar prédios." />
        ) : predios.length === 0 ? (
          <div
            className="text-center py-12 rounded-lg"
            style={{ backgroundColor: C.surface, border: `1px dashed ${C.border}`, color: C.text3 }}
          >
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
            <div className="text-[13px]">Nenhum prédio cadastrado com planta interna.</div>
          </div>
        ) : (
          <ul className="list-none p-0 m-0 space-y-3">
            {predios.map((p) => (
              <PredioCard key={p.id} predio={p} onAbrir={() => onAbrir(p.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function PredioCard({ predio, onAbrir }) {
  const r = resumoPredio(predio)
  return (
    <li
      className="rounded-lg overflow-hidden transition-all"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 1px 2px rgba(20,22,36,0.04)' }}
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
        <div className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center" style={{ backgroundColor: '#eef0ff' }}>
          <Building2 className="w-6 h-6" strokeWidth={1.5} style={{ color: C.accent }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
            {predio.nome}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
            {r.endereco}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: C.text2 }}>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" strokeWidth={1.75} />
              {r.qtd_andares} andar{r.qtd_andares !== 1 ? 'es' : ''}
            </span>
            <span>{r.qtd_salas} salas mapeadas</span>
            <span>{r.qtd_secretarias} secretaria{r.qtd_secretarias !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <button
          onClick={onAbrir}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors"
          style={{ backgroundColor: C.accent, color: '#fff' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
        >
          Abrir planta
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </li>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px]">{texto}</span>
    </div>
  )
}
