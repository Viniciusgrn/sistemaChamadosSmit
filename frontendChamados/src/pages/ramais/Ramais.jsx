import { useMemo, useState } from 'react'
import { Plus, Search, Phone, ArrowUpDown, Loader2, AlertCircle, Pencil } from 'lucide-react'

import { getResumo, getSetoresDistintos } from './data'
import { useRamais } from '../../hooks/useRamais'
import RamalModal from './RamalModal'
import { useAuth } from '../../contexts/AuthContext'

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

export default function Ramais() {
  const { data: todos = [], isLoading, isError, error } = useRamais()

  const [busca, setBusca] = useState('')

  const { user } = useAuth()
  // Cadastro é da coordenação. Quem manda é o backend
  // (core.permissions.CadastroDeRamalSoCoordenacao); esconder aqui
  // só evita oferecer um botão que devolveria 403.
  const podeEditarCadastro = !!(
    user?.administrativo || user?.eh_chefe || user?.eh_secretario || user?.is_superuser
  )
  const [filtroSetor, setFiltroSetor] = useState('')
  const [filtroOcupacao, setFiltroOcupacao] = useState('todos') // 'todos' | 'ocupados' | 'vagos'
  const [ordemPor, setOrdemPor] = useState('numero')
  const [editando, setEditando] = useState(undefined) // undefined=fechado, null=novo, obj=editar

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return todos
      .filter((r) => {
        if (filtroSetor && r.setor !== filtroSetor) return false
        if (filtroOcupacao === 'ocupados' && r.vago) return false
        if (filtroOcupacao === 'vagos' && !r.vago) return false
        if (q) {
          const blob = `${r.numero} ${r.ocupante || ''} ${r.setor || ''}`.toLowerCase()
          if (!blob.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (ordemPor === 'numero') return a.numero.localeCompare(b.numero, undefined, { numeric: true })
        if (ordemPor === 'ocupante') return (a.ocupante || 'zzz').localeCompare(b.ocupante || 'zzz')
        if (ordemPor === 'setor') return (a.setor || '').localeCompare(b.setor || '')
        return 0
      })
  }, [todos, busca, filtroSetor, filtroOcupacao, ordemPor])

  const resumo = getResumo(todos)
  const setoresDistintos = useMemo(() => getSetoresDistintos(todos), [todos])

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-6 py-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight m-0 flex items-center gap-2" style={{ color: C.text1 }}>
              <Phone className="w-5 h-5" strokeWidth={1.75} style={{ color: C.accent }} />
              Ramais
            </h1>
            <div className="text-[12px] mt-0.5 flex items-center gap-3 flex-wrap" style={{ color: C.text2 }}>
              <span>{resumo.total} ramais</span>
              <Resumo cor="#16a34a" count={resumo.ocupados} label="ativos" />
              <Resumo cor="#8b8d96" count={resumo.vagos}    label="vagos" />
              <Resumo cor="#4f46e5" count={resumo.setores}  label="setores" />
            </div>
          </div>

          {podeEditarCadastro && (
            <button
              onClick={() => setEditando(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ backgroundColor: C.accent, color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Novo ramal
            </button>
          )}
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
              placeholder="Buscar por ramal, ocupante ou setor…"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          <ChipGroup
            value={filtroOcupacao}
            onChange={setFiltroOcupacao}
            options={[
              { value: 'todos',    label: 'Todos' },
              { value: 'ocupados', label: 'Ativos' },
              { value: 'vagos',    label: 'Vagos' },
            ]}
          />

          <select
            value={filtroSetor}
            onChange={(e) => setFiltroSetor(e.target.value)}
            className="px-2.5 py-1.5 text-[12px] rounded-md focus:outline-none"
            style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
          >
            <option value="">Todos setores</option>
            {setoresDistintos.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <Estado icon={Loader2} spin texto="Carregando ramais…" />
        ) : isError ? (
          <Estado
            icon={AlertCircle}
            texto={
              error?.status === 401 || error?.status === 403
                ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                : `Erro ao carregar ramais${error?.status ? ` (${error.status})` : ''}.`
            }
          />
        ) : filtrados.length === 0 ? (
          <div
            className="max-w-md mx-auto mt-12 text-center py-12 rounded-lg"
            style={{ backgroundColor: C.surface, border: `1px dashed ${C.border2}`, color: C.text3 }}
          >
            <div className="text-[13px]">Nenhum ramal encontrado.</div>
          </div>
        ) : (
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border2}` }}>
                <Th label="Ramal"    campo="numero"   ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <Th label="Ocupante" campo="ocupante" ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <Th label="Setor"    campo="setor"    ordemPor={ordemPor} setOrdemPor={setOrdemPor} />
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody style={{ backgroundColor: C.surface }}>
              {filtrados.map((r) => (
                <Linha key={r.id} ramal={r} onEditar={podeEditarCadastro ? () => setEditando(r) : undefined} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editando !== undefined && (
        <RamalModal
          ramal={editando}
          setores={setoresDistintos}
          onClose={() => setEditando(undefined)}
        />
      )}
    </div>
  )
}

function Resumo({ cor, count, label }) {
  return (
    <span className="flex items-center gap-1" style={{ color: '#5b5e68' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }} />
      <span className="font-medium" style={{ color: '#15161b' }}>{count}</span>
      <span style={{ color: '#8b8d96' }}>{label}</span>
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

function Th({ label, campo, ordemPor, setOrdemPor }) {
  const ativo = ordemPor === campo
  return (
    <th
      className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium"
      style={{ color: ativo ? C.text1 : C.text3 }}
    >
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
    </th>
  )
}

function Linha({ ramal: r, onEditar }) {
  return (
    <tr
      className="transition-colors group"
      style={{ borderBottom: `1px solid ${C.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <td className="px-4 py-2.5">
        <span
          className="inline-flex items-center gap-1.5 font-mono font-semibold text-[14px]"
          style={{ color: C.text1 }}
        >
          <Phone className="w-3 h-3" strokeWidth={1.75} style={{ color: C.accent }} />
          {r.numero}
        </span>
      </td>
      <td className="px-4 py-2.5">
        {r.vago ? (
          <span className="text-[11px] italic" style={{ color: C.text3 }}>vago</span>
        ) : (
          <span className="font-medium" style={{ color: C.text1 }}>{r.ocupante}</span>
        )}
      </td>
      <td className="px-4 py-2.5" style={{ color: C.text2 }}>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
          style={{ backgroundColor: '#eef0ff', color: '#2d2783' }}
        >
          {r.setor}
        </span>
      </td>
      <td className="px-2 py-2.5 text-right">
        {/* sem handler = sem permissao: a tela vira consulta */}
        {onEditar && (
        <button
          onClick={onEditar}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 inline-flex items-center justify-center rounded transition-all"
          style={{ color: C.text3 }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eef0ff'; e.currentTarget.style.color = C.accent }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
          aria-label="Editar ramal"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
        )}
      </td>
    </tr>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px] max-w-xs text-center">{texto}</span>
    </div>
  )
}
