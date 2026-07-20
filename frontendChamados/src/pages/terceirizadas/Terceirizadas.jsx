import { useMemo, useState } from 'react'
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react'

import EmpresaCard from './EmpresaCard'
import EmpresaDrawer from './EmpresaDrawer'
import EmpresaModal from './EmpresaModal'
import { RESP_META } from './data'
import { useEmpresas } from '../../hooks/useTerceirizadas'

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

export default function Terceirizadas() {
  const { data: todas = [], isLoading, isError, error } = useEmpresas()

  const [busca, setBusca] = useState('')
  const [filtroResp, setFiltroResp] = useState(null) // id da responsabilidade
  const [selecionada, setSelecionada] = useState(null)
  const [editando, setEditando] = useState(undefined) // undefined=fechado, null=novo, obj=editar

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return todas.filter((e) => {
      if (filtroResp !== null && e.responsabilidade !== filtroResp) return false
      if (q) {
        const blob = `${e.nome} ${e.numero_telefone} ${e.link_site || ''}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [todas, busca, filtroResp])

  const totalAtivos = filtradas.reduce((acc, e) => acc + e.qtd_ativos, 0)
  const totalChamados = filtradas.reduce((acc, e) => acc + e.qtd_total, 0)

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
              Empresas Terceirizadas
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              {filtradas.length} empresa{filtradas.length !== 1 ? 's' : ''}
              {' · '}
              {totalAtivos} ativos
              {' · '}
              {totalChamados} chamados no total
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
            Nova empresa
          </button>
        </div>

        {/* Busca + filtro de responsabilidade */}
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
              placeholder="Buscar por nome, telefone ou site…"
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

      {/* Grid de cards */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
            <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.75} />
            <span className="text-[13px]">Carregando empresas…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
            <span className="text-[13px] max-w-xs text-center">
              {error?.status === 401 || error?.status === 403
                ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                : `Erro ao carregar empresas${error?.status ? ` (${error.status})` : ''}.`}
            </span>
          </div>
        ) : filtradas.length === 0 ? (
          <div
            className="max-w-md mx-auto text-center py-12 rounded-lg"
            style={{
              backgroundColor: C.surface,
              border: `1px dashed ${C.border}`,
              color: C.text3,
            }}
          >
            <div className="text-[13px]">Nenhuma empresa encontrada.</div>
          </div>
        ) : (
          <ul
            className="list-none p-0 m-0 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
          >
            {filtradas.map((e) => (
              <EmpresaCard
                key={e.id}
                empresa={e}
                onClick={() => setSelecionada(e)}
              />
            ))}
          </ul>
        )}
      </div>

      {selecionada && (
        <EmpresaDrawer
          empresa={selecionada}
          onClose={() => setSelecionada(null)}
          onEditar={(empresa) => { setSelecionada(null); setEditando(empresa) }}
        />
      )}

      {editando !== undefined && (
        <EmpresaModal
          empresa={editando}
          onClose={() => setEditando(undefined)}
        />
      )}
    </div>
  )
}
