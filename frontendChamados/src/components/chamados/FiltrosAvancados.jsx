import { useEffect, useMemo } from 'react'
import { X, RotateCcw, Calendar } from 'lucide-react'
import { PRIORITY_META } from '../../pages/chamados/data'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  hover:    '#f3f2ee',
  border:   '#ececea',
  border2:  '#e3e2df',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  accentInk:'#2d2783',
}

const EQUIPE_OPCOES = [
  { id: 'todas', label: 'Qualquer' },
  { id: 'sem',   label: 'Sem equipe' },
  { id: 'com',   label: 'Com equipe' },
]

// Helpers de data
function toISO(d) {
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function preset(tipo) {
  const hoje = new Date()
  const fim = toISO(hoje)
  if (tipo === 'hoje') return { inicio: fim, fim }
  if (tipo === 'semana') {
    const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - 6)
    return { inicio: toISO(inicio), fim }
  }
  if (tipo === 'mes') {
    const inicio = new Date(hoje); inicio.setDate(1)
    return { inicio: toISO(inicio), fim }
  }
  return { inicio: '', fim: '' }
}

// Painel inline (não é mais popover). Aparece "uma aba abaixo" da toolbar.
export default function FiltrosAvancados({
  open,
  onClose,
  filtros,
  setFiltros,
  parsedSecretarias,   // [{ secretaria, divisoes: Set<string> }]
  equipes,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Divisões disponíveis pra secretaria escolhida
  const divisoesDisponiveis = useMemo(() => {
    if (!filtros.secretaria) return []
    const item = parsedSecretarias.find((s) => s.secretaria === filtros.secretaria)
    return item ? Array.from(item.divisoes).sort() : []
  }, [filtros.secretaria, parsedSecretarias])

  // Verifica qual preset está ativo (se os dates batem)
  const presetAtivo = useMemo(() => {
    if (!filtros.data_inicio || !filtros.data_fim) return null
    for (const tipo of ['hoje', 'semana', 'mes']) {
      const p = preset(tipo)
      if (p.inicio === filtros.data_inicio && p.fim === filtros.data_fim) return tipo
    }
    return null
  }, [filtros.data_inicio, filtros.data_fim])

  if (!open) return null

  const togglePrioridade = (p) => {
    setFiltros((f) => {
      const set = new Set(f.prioridades)
      if (set.has(p)) set.delete(p); else set.add(p)
      return { ...f, prioridades: Array.from(set) }
    })
  }

  const aplicarPreset = (tipo) => {
    const { inicio, fim } = preset(tipo)
    setFiltros((f) => ({ ...f, data_inicio: inicio, data_fim: fim }))
  }

  const limpar = () => setFiltros({
    data_inicio: '',
    data_fim: '',
    prioridades: [],
    equipe: 'todas',
    equipe_id: null,
    secretaria: '',
    divisao: '',
  })

  return (
    <div
      className="border-t animate-fade-in"
      style={{ borderColor: C.border, backgroundColor: C.surface2 }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="text-[12px] font-semibold tracking-tight" style={{ color: C.text1 }}>
          Filtros avançados
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={limpar}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
            style={{ color: C.text2 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
          >
            <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
            Limpar
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ color: C.text3 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Body - grid responsivo de campos */}
      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
        {/* Período */}
        <Grupo label="Período" colSpan>
          <div className="flex items-center gap-1.5 mb-2">
            <PresetBtn ativo={presetAtivo === 'hoje'}   onClick={() => aplicarPreset('hoje')}>Hoje</PresetBtn>
            <PresetBtn ativo={presetAtivo === 'semana'} onClick={() => aplicarPreset('semana')}>7 dias</PresetBtn>
            <PresetBtn ativo={presetAtivo === 'mes'}    onClick={() => aplicarPreset('mes')}>Este mês</PresetBtn>
          </div>
          <div className="flex items-center gap-2">
            <DateInput
              valor={filtros.data_inicio}
              onChange={(v) => setFiltros((f) => ({ ...f, data_inicio: v }))}
              placeholder="De"
            />
            <span className="text-[11px]" style={{ color: C.text3 }}>até</span>
            <DateInput
              valor={filtros.data_fim}
              onChange={(v) => setFiltros((f) => ({ ...f, data_fim: v }))}
              placeholder="Até"
            />
          </div>
        </Grupo>

        {/* Prioridade */}
        <Grupo label="Prioridade" hint="Múltipla seleção">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['urgente', 'alta', 'media', 'baixa'].map((p) => {
              const ativo = filtros.prioridades.includes(p)
              const meta = PRIORITY_META[p]
              return (
                <button
                  key={p}
                  onClick={() => togglePrioridade(p)}
                  className="inline-flex items-center justify-center px-2 py-1 rounded text-[11px] font-medium tracking-tight transition-colors"
                  style={
                    ativo
                      ? { backgroundColor: meta.bg, color: meta.fg, border: `1px solid ${meta.fg}33`, boxShadow: '0 1px 2px rgba(20,22,36,0.06)' }
                      : { backgroundColor: C.surface, color: C.text2, border: `1px solid ${C.border}` }
                  }
                >
                  {meta.label}
                </button>
              )
            })}
          </div>
        </Grupo>

        {/* Equipe */}
        <Grupo label="Equipe atribuída">
          <Segmented
            value={filtros.equipe}
            onChange={(v) => setFiltros((f) => ({ ...f, equipe: v, equipe_id: null }))}
            options={EQUIPE_OPCOES}
          />
          {filtros.equipe === 'com' && (
            <select
              value={filtros.equipe_id || ''}
              onChange={(e) => setFiltros((f) => ({ ...f, equipe_id: e.target.value || null }))}
              className="mt-2 w-full px-3 py-1.5 text-[12px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text1 }}
            >
              <option value="">Qualquer equipe</option>
              {equipes.map((e) => (
                <option key={e.id} value={e.id}>{e.name} · {e.id}</option>
              ))}
            </select>
          )}
        </Grupo>

        {/* Secretaria → Divisão (cascata) */}
        <Grupo label="Secretaria solicitante">
          <select
            value={filtros.secretaria}
            onChange={(e) => setFiltros((f) => ({ ...f, secretaria: e.target.value, divisao: '' }))}
            className="w-full px-3 py-1.5 text-[12px] rounded-md focus:outline-none"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text1 }}
          >
            <option value="">Todas</option>
            {parsedSecretarias.map((s) => (
              <option key={s.secretaria} value={s.secretaria}>{s.secretaria}</option>
            ))}
          </select>
        </Grupo>

        <Grupo
          label="Divisão"
          hint={filtros.secretaria ? `${divisoesDisponiveis.length} disponível(is)` : 'Escolha uma secretaria primeiro'}
        >
          <select
            value={filtros.divisao}
            onChange={(e) => setFiltros((f) => ({ ...f, divisao: e.target.value }))}
            disabled={!filtros.secretaria}
            className="w-full px-3 py-1.5 text-[12px] rounded-md focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text1 }}
          >
            <option value="">Todas</option>
            {divisoesDisponiveis.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Grupo>
      </div>
    </div>
  )
}

function Grupo({ label, hint, colSpan, children }) {
  return (
    <div className={colSpan ? 'md:col-span-2 lg:col-span-1' : ''}>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: C.text3 }}>
          {label}
        </div>
        {hint && <div className="text-[10px]" style={{ color: C.text3 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-md w-full"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      {options.map((opt) => {
        const ativo = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="flex-1 px-2 py-1 rounded text-[11px] font-medium transition-colors text-center"
            style={
              ativo
                ? { backgroundColor: C.surface2, color: C.text1, boxShadow: '0 1px 2px rgba(20,22,36,0.06)' }
                : { backgroundColor: 'transparent', color: C.text2 }
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function PresetBtn({ ativo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-[10px] font-medium tracking-tight transition-colors"
      style={
        ativo
          ? { backgroundColor: '#eef0ff', color: '#2d2783', border: '1px solid #c7d2fe' }
          : { backgroundColor: C.surface, color: C.text2, border: `1px solid ${C.border}` }
      }
    >
      {children}
    </button>
  )
}

function DateInput({ valor, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <Calendar
        className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
        strokeWidth={1.75}
        style={{ color: C.text3 }}
      />
      <input
        type="date"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-2 py-1.5 text-[12px] rounded-md focus:outline-none"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text1 }}
      />
    </div>
  )
}
