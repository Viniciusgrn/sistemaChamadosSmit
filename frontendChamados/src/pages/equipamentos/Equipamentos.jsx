import { useMemo, useState } from 'react'
import { Plus, Search, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react'

import EquipamentoDrawer from './EquipamentoDrawer'
import EquipamentoModal from './EquipamentoModal'
import { useEquipamentos } from '../../hooks/useEquipamentos'
import {
  TIPO_META,
  STATUS_META,
  getResumoEquipamentos,
  getUnidadesDistintas,
} from './data'

const C = {
  bg:        '#f7f7f4',
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  hover:     '#f3f2ee',
  border:    '#ececea',
  border2:   '#e3e2df',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

export default function Equipamentos() {
  const { data: todos = [], isLoading, isError, error } = useEquipamentos()

  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState(null)
  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [ordemPor, setOrdemPor] = useState('patrimonio')
  const [editando, setEditando] = useState(undefined) // undefined=fechado, null=novo, obj=editar

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return todos
      .filter((e) => {
        if (filtroTipo !== null && e.tipo !== filtroTipo) return false
        if (filtroStatus !== null && e.status !== filtroStatus) return false
        if (filtroUnidade && e.unidade !== filtroUnidade) return false
        if (q) {
          const blob = `${e.patrimonio} ${e.numero_de_serie} ${e.marca} ${e.modelo}`.toLowerCase()
          if (!blob.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (ordemPor === 'patrimonio') return a.patrimonio.localeCompare(b.patrimonio)
        if (ordemPor === 'modelo')     return `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`)
        if (ordemPor === 'tipo')       return a.tipo - b.tipo
        if (ordemPor === 'status')     return a.status - b.status
        if (ordemPor === 'unidade')    return (a.unidade || '').localeCompare(b.unidade || '')
        return 0
      })
  }, [todos, busca, filtroTipo, filtroStatus, filtroUnidade, ordemPor])

  const resumo = getResumoEquipamentos(todos)
  const unidadesDistintas = useMemo(() => getUnidadesDistintas(todos), [todos])

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
              Equipamentos
            </h1>
            <div className="text-[12px] mt-0.5 flex items-center gap-3 flex-wrap" style={{ color: C.text2 }}>
              <span>{todos.length} cadastrados</span>
              <Resumo label="em uso"         cor={STATUS_META[0].cor} count={resumo.em_uso} />
              <Resumo label="em estoque"     cor={STATUS_META[1].cor} count={resumo.estoque} />
              <Resumo label="em manutenção"  cor={STATUS_META[2].cor} count={resumo.em_manutencao} />
              <Resumo label="em descarte"    cor={STATUS_META[3].cor} count={resumo.descarte} />
            </div>
          </div>

          <button
            onClick={() => setEditando(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Novo equipamento
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
              placeholder="Buscar por patrimônio, série, marca, modelo…"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          <Select
            value={filtroTipo}
            onChange={setFiltroTipo}
            placeholder="Todos tipos"
            options={Object.entries(TIPO_META).map(([id, m]) => ({ value: Number(id), label: m.label }))}
          />
          <Select
            value={filtroStatus}
            onChange={setFiltroStatus}
            placeholder="Todos status"
            options={Object.entries(STATUS_META).map(([id, m]) => ({ value: Number(id), label: m.label }))}
          />
          <Select
            value={filtroUnidade || null}
            onChange={(v) => setFiltroUnidade(v || '')}
            placeholder="Todas unidades"
            options={unidadesDistintas.map((u) => ({ value: u, label: u }))}
          />
        </div>
      </header>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <Estado icon={Loader2} spin texto="Carregando equipamentos…" />
        ) : isError ? (
          <Estado
            icon={AlertCircle}
            texto={
              error?.status === 401 || error?.status === 403
                ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                : `Erro ao carregar equipamentos${error?.status ? ` (${error.status})` : ''}.`
            }
          />
        ) : filtrados.length === 0 ? (
          <div
            className="max-w-md mx-auto mt-12 text-center py-12 rounded-lg"
            style={{ backgroundColor: C.surface, border: `1px dashed ${C.border2}`, color: C.text3 }}
          >
            <div className="text-[13px]">Nenhum equipamento encontrado.</div>
          </div>
        ) : (
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border2}` }}>
                <Th label="Patrimônio" campo="patrimonio" ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <Th label="Modelo"     campo="modelo"     ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <Th label="Tipo"       campo="tipo"       ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <Th label="Status"     campo="status"     ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <Th label="Unidade"    campo="unidade"    ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <Th label="Nº série"   campo="serie"      ordemPor={ordemPor} setOrdemPor={setOrdemPor} ordenavel={false} />
              </tr>
            </thead>
            <tbody style={{ backgroundColor: C.surface }}>
              {filtrados.map((e) => (
                <Linha key={e.id} equipamento={e} onClick={() => setSelecionado(e)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selecionado && (
        <EquipamentoDrawer
          equipamento={selecionado}
          onClose={() => setSelecionado(null)}
          onEditar={() => { setEditando(selecionado); setSelecionado(null) }}
        />
      )}

      {editando !== undefined && (
        <EquipamentoModal
          equipamento={editando}
          onClose={() => setEditando(undefined)}
        />
      )}
    </div>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24" style={{ color: '#8b8d96' }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px] max-w-xs text-center">{texto}</span>
    </div>
  )
}

function Resumo({ label, cor, count }) {
  return (
    <span className="flex items-center gap-1" style={{ color: '#5b5e68' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }} />
      <span className="font-medium" style={{ color: '#15161b' }}>{count}</span>
      <span style={{ color: '#8b8d96' }}>{label}</span>
    </span>
  )
}

function Select({ value, onChange, placeholder, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : (typeof options[0]?.value === 'number' ? Number(e.target.value) : e.target.value))}
      className="px-2.5 py-1.5 text-[12px] rounded-md focus:outline-none"
      style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Th({ label, campo, ordemPor, setOrdemPor, ordenavel = true }) {
  const ativo = ordemPor === campo
  return (
    <th
      className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium"
      style={{ color: ativo ? C.text1 : C.text3 }}
    >
      {ordenavel ? (
        <button
          onClick={() => setOrdemPor(campo)}
          className="flex items-center gap-1 transition-colors"
          style={{ color: 'inherit' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.text1)}
          onMouseLeave={(e) => (e.currentTarget.style.color = ativo ? C.text1 : C.text3)}
        >
          {label}
          <ArrowUpDown className="w-3 h-3 opacity-70" strokeWidth={1.75} />
        </button>
      ) : (
        label
      )}
    </th>
  )
}

function Linha({ equipamento, onClick }) {
  const tipo = TIPO_META[equipamento.tipo]
  const status = STATUS_META[equipamento.status]
  const Icone = tipo.icon

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          onClick()
        }
      }}
      className="cursor-pointer transition-colors outline-none"
      style={{ borderBottom: `1px solid ${C.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.text1 }}>
        {equipamento.patrimonio}
      </td>
      <td className="px-4 py-2.5" style={{ color: C.text1 }}>
        <div className="font-medium">{equipamento.marca} {equipamento.modelo}</div>
      </td>
      <td className="px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: tipo.cor }}>
          <Icone className="w-3.5 h-3.5" strokeWidth={1.75} />
          {tipo.label}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
          style={{ backgroundColor: status.bg, color: status.cor }}
        >
          {status.label}
        </span>
      </td>
      <td className="px-4 py-2.5" style={{ color: C.text2 }}>
        {equipamento.unidade}
      </td>
      <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: C.text3 }}>
        {equipamento.numero_de_serie}
      </td>
    </tr>
  )
}
