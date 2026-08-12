import { useMemo, useState } from 'react'
import { Plus, Search, AlertTriangle, Wrench, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'

import ManutencaoCard from './ManutencaoCard'
import ManutencaoDrawer from './ManutencaoDrawer'
import ManutencaoModal from './ManutencaoModal'
import { STATUS, STATUS_META, agruparPorStatus, getResumo } from './data'
import { adaptaManutencao } from './adapters'
import { useManutencoes } from '../../hooks/useManutencao'

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

export default function Manutencao() {
  const { data: brutas = [], isLoading, isError, error } = useManutencoes()
  const todas = useMemo(() => brutas.map(adaptaManutencao), [brutas])

  const [busca, setBusca] = useState('')
  const [aba, setAba] = useState(STATUS.EM_ANDAMENTO)
  const [selecionada, setSelecionada] = useState(null)
  const [editando, setEditando] = useState(undefined) // undefined=fechado, null=nova, obj=editar

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return todas
    return todas.filter((m) => {
      const blob = `${m.equipamento.patrimonio} ${m.equipamento.marca} ${m.equipamento.modelo} ${m.diagnostico} ${m.chamado_codigo} ${m.tecnicos.map((t) => t.primeiro_nome).join(' ')}`.toLowerCase()
      return blob.includes(q)
    })
  }, [todas, busca])

  const resumo = useMemo(() => getResumo(todas), [todas])
  const grupos = useMemo(() => agruparPorStatus(filtradas), [filtradas])

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h1 className="text-[17px] sm:text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
              Manutenções
            </h1>
            <div className="text-[12px] mt-0.5 flex items-center gap-x-3 gap-y-1 flex-wrap" style={{ color: C.text2 }}>
              <span>{todas.length} ordens</span>
              <Resumo cor={STATUS_META[STATUS.EM_ANDAMENTO].cor}  count={resumo.em_andamento}  label="em andamento" />
              <Resumo cor={STATUS_META[STATUS.FINALIZADO].cor}    count={resumo.finalizado}    label="finalizada(s)" />
              <Resumo cor={STATUS_META[STATUS.NAO_REALIZADA].cor} count={resumo.nao_realizada} label="sem conserto" />
            </div>
          </div>

          {/* No celular vira só o "+": o rótulo inteiro empurraria o título */}
          <button
            onClick={() => setEditando(null)}
            className="flex items-center justify-center gap-1.5 w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-md text-[12px] font-medium transition-colors flex-shrink-0"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            title="Retirar para manutenção"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Retirar para manutenção</span>
          </button>
        </div>

        {/* Alerta de backup pendente */}
        {resumo.backup_pendente > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] mb-3"
            style={{ backgroundColor: '#fef3c7', color: '#d81111', border: '1px solid #fc4d4d' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
            <span>
              <strong>{resumo.backup_pendente}</strong>
              {' '}
              {resumo.backup_pendente === 1 ? 'computador aguardando backup' : 'computadores aguardando backup'}
              {' '}- backup é obrigatório antes da manutenção.
            </span>
          </div>
        )}

        {/* Busca + tabs */}
        <div className="space-y-3">
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
              placeholder="Buscar patrimônio, modelo, diagnóstico…"
              className="w-full pl-8 pr-3 min-h-[40px] sm:min-h-0 sm:py-1.5 text-[12px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          {/* As 3 abas não cabem em 375px: rolam na horizontal em vez de quebrar */}
          <div className="flex items-center gap-1 -mb-px overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
            <Tab
              ativo={aba === STATUS.EM_ANDAMENTO}
              icon={Wrench}
              label="Em andamento"
              count={grupos[STATUS.EM_ANDAMENTO].length}
              cor={STATUS_META[STATUS.EM_ANDAMENTO].cor}
              onClick={() => setAba(STATUS.EM_ANDAMENTO)}
            />
            <Tab
              ativo={aba === STATUS.FINALIZADO}
              icon={CheckCircle2}
              label="Finalizadas"
              count={grupos[STATUS.FINALIZADO].length}
              cor={STATUS_META[STATUS.FINALIZADO].cor}
              onClick={() => setAba(STATUS.FINALIZADO)}
            />
            <Tab
              ativo={aba === STATUS.NAO_REALIZADA}
              icon={XCircle}
              label="Sem conserto"
              count={grupos[STATUS.NAO_REALIZADA].length}
              cor={STATUS_META[STATUS.NAO_REALIZADA].cor}
              onClick={() => setAba(STATUS.NAO_REALIZADA)}
            />
          </div>
        </div>
      </header>

      {/* Conteúdo: cards da aba ativa */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
              <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.75} />
              <span className="text-[13px]">Carregando manutenções…</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
              <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
              <span className="text-[13px] max-w-xs text-center">
                {error?.status === 401 || error?.status === 403
                  ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                  : 'Erro ao carregar manutenções.'}
              </span>
            </div>
          ) : grupos[aba].length === 0 ? (
            <div
              className="text-center py-12 rounded-lg text-[12px]"
              style={{ backgroundColor: C.surface, border: `1px dashed ${C.border}`, color: C.text3 }}
            >
              {busca.trim()
                ? 'Nenhum resultado nesta etapa. Veja outras abas com contadores.'
                : aba === STATUS.EM_ANDAMENTO
                  ? 'Nenhuma manutenção em andamento.'
                  : aba === STATUS.FINALIZADO
                    ? 'Nenhuma manutenção finalizada.'
                    : 'Nenhuma manutenção encerrada sem conserto.'}
            </div>
          ) : (
            <ul className="list-none p-0 m-0 space-y-3">
              {grupos[aba].map((m) => (
                <ManutencaoCard key={m.id} manutencao={m} onClick={() => setSelecionada(m)} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {selecionada && (
        <ManutencaoDrawer
          manutencao={selecionada}
          onClose={() => setSelecionada(null)}
          onEditar={(m) => { setSelecionada(null); setEditando(m) }}
        />
      )}

      {editando !== undefined && (
        <ManutencaoModal
          manutencao={editando}
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

function Tab({ ativo, icon: Icon, label, count, cor, onClick }) {
  const temResultado = count > 0
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 min-h-[44px] sm:min-h-0 sm:py-2 text-[13px] font-medium transition-colors relative flex-shrink-0 whitespace-nowrap"
      style={{
        color: ativo ? cor : (temResultado ? C.text2 : C.text3),
      }}
      onMouseEnter={(e) => { if (!ativo) e.currentTarget.style.color = C.text1 }}
      onMouseLeave={(e) => { if (!ativo) e.currentTarget.style.color = temResultado ? C.text2 : C.text3 }}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      {label}
      <span
        className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-tight"
        style={
          ativo
            ? { backgroundColor: `${cor}1a`, color: cor, border: `1px solid ${cor}44` }
            : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
        }
      >
        {count}
      </span>
      {ativo && (
        <span
          className="absolute left-0 right-0 -bottom-px h-0.5"
          style={{ backgroundColor: cor }}
        />
      )}
    </button>
  )
}
