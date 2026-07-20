import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'

import TecnicoCard from './TecnicoCard'
import TecnicoDrawer from './TecnicoDrawer'
import { SEED_TECNICOS, RESP_META, STATUS_META, getResumo } from './data'

const C = {
  bg:        '#f7f7f4',
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  border:    '#ececea',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

const STATUS_FILTROS = [
  { value: 'todos',      label: 'Todos' },
  { value: 'em_campo',   label: 'Em campo' },
  { value: 'em_lobby',   label: 'Em formação' },
  { value: 'disponivel', label: 'Disponível' },
  { value: 'folga',      label: 'Folga' },
]

export default function Tecnicos() {
  // TODO: trocar por useQuery quando wire na API
  const todos = SEED_TECNICOS

  const [busca, setBusca] = useState('')
  const [filtroResp, setFiltroResp] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [selecionado, setSelecionado] = useState(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return todos.filter((t) => {
      if (filtroResp !== null && !(t.responsabilidades || []).includes(filtroResp)) return false
      if (filtroStatus !== 'todos' && t.status !== filtroStatus) return false
      if (q) {
        const blob = `${t.nome_completo} ${t.matricula} ${t.unidade}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [todos, busca, filtroResp, filtroStatus])

  const resumo = getResumo(todos)

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-6 py-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
              Técnicos
            </h1>
            <div className="text-[12px] mt-0.5 flex items-center gap-3 flex-wrap" style={{ color: C.text2 }}>
              <span>{todos.length} cadastrados</span>
              <Stat status="em_campo"   count={resumo.em_campo} />
              <Stat status="em_lobby"   count={resumo.em_lobby} />
              <Stat status="disponivel" count={resumo.disponivel} />
              <Stat status="folga"      count={resumo.folga} />
            </div>
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Novo técnico
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              strokeWidth={1.75}
              style={{ color: C.text3 }}
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, matrícula, unidade…"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md focus:outline-none"
              style={{
                backgroundColor: C.surface2,
                border: `1px solid ${C.border}`,
                color: C.text1,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          <ChipGroup
            value={filtroStatus}
            onChange={setFiltroStatus}
            options={STATUS_FILTROS}
          />

          <select
            value={filtroResp ?? ''}
            onChange={(e) => setFiltroResp(e.target.value === '' ? null : Number(e.target.value))}
            className="px-2.5 py-1.5 text-[12px] rounded-md focus:outline-none"
            style={{
              backgroundColor: C.surface2,
              border: `1px solid ${C.border}`,
              color: C.text1,
            }}
          >
            <option value="">Todas responsabilidades</option>
            {Object.entries(RESP_META).map(([id, meta]) => (
              <option key={id} value={id}>{meta.label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtrados.length === 0 ? (
          <div
            className="max-w-md mx-auto text-center py-12 rounded-lg"
            style={{
              backgroundColor: C.surface,
              border: `1px dashed ${C.border}`,
              color: C.text3,
            }}
          >
            <div className="text-[13px]">Nenhum técnico encontrado.</div>
          </div>
        ) : (
          <ul
            className="list-none p-0 m-0 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
          >
            {filtrados.map((t) => (
              <TecnicoCard
                key={t.id}
                tecnico={t}
                onClick={() => setSelecionado(t)}
              />
            ))}
          </ul>
        )}
      </div>

      {selecionado && (
        <TecnicoDrawer
          tecnico={selecionado}
          onClose={() => setSelecionado(null)}
          onEditar={() => { /* TODO */ }}
        />
      )}
    </div>
  )
}

function Stat({ status, count }) {
  const meta = STATUS_META[status]
  return (
    <span className="flex items-center gap-1" style={{ color: '#5b5e68' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.cor }} />
      <span className="font-medium" style={{ color: '#15161b' }}>{count}</span>
      <span style={{ color: '#8b8d96' }}>{meta.label.toLowerCase()}</span>
    </span>
  )
}

function ChipGroup({ value, onChange, options }) {
  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-md"
      style={{ backgroundColor: '#fbfaf7', border: '1px solid #ececea' }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
          style={
            value === opt.value
              ? { backgroundColor: '#eef0ff', color: '#2d2783' }
              : { backgroundColor: 'transparent', color: '#5b5e68' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
