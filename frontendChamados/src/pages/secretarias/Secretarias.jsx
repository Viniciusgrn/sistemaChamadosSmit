import { useMemo, useState } from 'react'
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react'

import SecretariaCard from './SecretariaCard'
import SecretariaDrawer from './SecretariaDrawer'
import SecretariaModal from './SecretariaModal'
import DivisaoModal from './DivisaoModal'
import { useSecretariasArvore } from '../../hooks/useLocalidades'

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

export default function Secretarias() {
  const { data: todas = [], isLoading, isError, error } = useSecretariasArvore()

  const [busca, setBusca] = useState('')
  const [selecionada, setSelecionada] = useState(null)
  // undefined = fechado | null = novo | objeto = editando
  const [editandoSec, setEditandoSec] = useState(undefined)
  const [editandoDiv, setEditandoDiv] = useState(undefined)

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return todas
    return todas.filter((s) => {
      const blob = `${s.nome} ${s.sigla} ${s.secretario || ''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [todas, busca])

  const totalDivisoes = filtradas.reduce((acc, s) => acc + s.qtd_divisoes, 0)
  const totalUnidades = filtradas.reduce((acc, s) => acc + s.qtd_unidades, 0)

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
              Secretarias
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              {filtradas.length} secretaria{filtradas.length !== 1 ? 's' : ''}
              {' · '}
              {totalDivisoes} divisões
              {' · '}
              {totalUnidades} unidades
            </div>
          </div>

          <button
            onClick={() => setEditandoSec(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nova secretaria
          </button>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            strokeWidth={1.75}
            style={{ color: C.text3 }}
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, sigla ou secretário…"
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
      </header>

      {/* Grid de cards */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: C.text3 }}>
            <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.75} />
            <span className="text-[13px]">Carregando secretarias…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: C.text3 }}>
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
            <span className="text-[13px] max-w-xs text-center">
              {error?.status === 401 || error?.status === 403
                ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                : `Erro ao carregar secretarias${error?.status ? ` (${error.status})` : ''}.`}
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
            <div className="text-[13px]">Nenhuma secretaria encontrada.</div>
          </div>
        ) : (
          <ul
            className="list-none p-0 m-0 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
          >
            {filtradas.map((s) => (
              <SecretariaCard
                key={s.id}
                secretaria={s}
                onClick={() => setSelecionada(s)}
              />
            ))}
          </ul>
        )}
      </div>

      {selecionada && (
        <SecretariaDrawer
          secretaria={selecionada}
          onClose={() => setSelecionada(null)}
          onEditar={(s) => setEditandoSec(s)}
          onNovaDivisao={() => setEditandoDiv(null)}
          onEditarDivisao={(d) => setEditandoDiv(d)}
        />
      )}

      {editandoSec !== undefined && (
        <SecretariaModal
          secretaria={editandoSec}
          onClose={() => setEditandoSec(undefined)}
        />
      )}

      {editandoDiv !== undefined && (
        <DivisaoModal
          divisao={editandoDiv}
          secretaria={selecionada}
          onClose={() => setEditandoDiv(undefined)}
        />
      )}
    </div>
  )
}
