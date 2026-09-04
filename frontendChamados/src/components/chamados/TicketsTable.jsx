import { useMemo, useState } from "react"
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { PriorityCell, StatusChip, LocalChamado } from "./shared"
import { TERCEIRIZADAS_META, PRIORITY_META, TERC_STATUS_META, STATUS_META, STATUS_EDITAVEIS } from "../../pages/chamados/data"
import FiltrosAvancados from "./FiltrosAvancados"
import TerceirizadaModal from "./TerceirizadaModal"

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

// Chamado não encerrado fica todo na mesma aba, seja qual for a etapa —
// agendado e encaminhado p/ terceirizada continuam sendo trabalho em aberto.
// "Em manutenção" é a exceção: virou ordem no app de manutenção e tem fluxo
// próprio, então fica na aba dele.
export const STATUS_ABERTOS = ['aberto', 'em_andamento', 'agendado', 'em_terceirizada']
// resolvido e cancelado saíram da fila: os dois juntos são "finalizados"
export const STATUS_FINALIZADOS = ['resolvido', 'cancelado']

const STATUS_CHIPS = [
  { id: "abertos",          label: "Em aberto" },
  { id: "em_manutencao",    label: "Em manutenção" },
  { id: "com_terceirizada", label: "Com terceirizada" },
  { id: "finalizados",      label: "Finalizados" },
  { id: "todos",            label: "Todos" },
]

const DEFAULT_FILTROS = {
  data_inicio: '',
  data_fim:    '',
  prioridades: [],
  status:      [],      // recorte por etapa dentro da aba
  equipe:      'todas',
  equipe_id:   null,
  secretaria:  '',
  divisao:     '',
}

// Mock: o campo `client` é "Secretaria de X - Divisão Y". Parse pra separar.
function parseClient(c) {
  const ix = c.indexOf(' - ')
  if (ix === -1) return { secretaria: c, divisao: '' }
  return { secretaria: c.slice(0, ix), divisao: c.slice(ix + 3) }
}

// Mock: o mock tem `date` como "Hoje" ou "Ontem". Mapeia pra ISO local.
function dateMockToISO(d) {
  const hoje = new Date()
  if (d === 'Hoje') return iso(hoje)
  if (d === 'Ontem') {
    const x = new Date(hoje); x.setDate(hoje.getDate() - 1)
    return iso(x)
  }
  return null
}
function iso(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function TicketsTable({ tickets, teams = [], query, setQuery, onOpen, onUpdate }) {
  const [statusFilter, setStatusFilter] = useState("abertos")
  const [filtroTerc, setFiltroTerc] = useState(null)
  const [filtros, setFiltros] = useState(DEFAULT_FILTROS)
  const [painelAberto, setPainelAberto] = useState(false)
  const [openTerc, setOpenTerc] = useState(null)   // item flatten ativo no modal

  const aba = statusFilter === 'com_terceirizada'

  // etapas que o filtro fino oferece: só as que existem na aba escolhida
  const statusDisponiveis =
    statusFilter === 'abertos'     ? STATUS_ABERTOS :
    statusFilter === 'finalizados' ? STATUS_FINALIZADOS :
    [...STATUS_ABERTOS, 'em_manutencao', ...STATUS_FINALIZADOS]

  // trocar de aba zera o recorte por etapa - senão a lista some sem explicação
  const trocarAba = (id) => {
    setStatusFilter(id)
    setFiltros((f) => (f.status.length ? { ...f, status: [] } : f))
  }

  // Parseia secretarias/divisões a partir dos clients dos tickets
  const parsedSecretarias = useMemo(() => {
    const map = new Map()
    tickets.forEach((t) => {
      const { secretaria, divisao } = parseClient(t.client)
      if (!map.has(secretaria)) map.set(secretaria, new Set())
      if (divisao) map.get(secretaria).add(divisao)
    })
    return Array.from(map.entries())
      .map(([secretaria, divisoes]) => ({ secretaria, divisoes }))
      .sort((a, b) => a.secretaria.localeCompare(b.secretaria))
  }, [tickets])

  const filtered = tickets.filter((t) => {
    if (statusFilter === 'abertos') {
      if (!STATUS_ABERTOS.includes(t.status)) return false
    } else if (statusFilter === 'finalizados') {
      if (!STATUS_FINALIZADOS.includes(t.status)) return false
    } else if (statusFilter === 'com_terceirizada') {
      // Critério é ter terceirizada vinculada, independente do status interno
      if (!Array.isArray(t.terceirizadas) || t.terceirizadas.length === 0) return false
      if (filtroTerc && !t.terceirizadas.some((x) => x.empresa === filtroTerc)) return false
    } else if (statusFilter !== "todos" && t.status !== statusFilter) return false

    // recorte fino por etapa, dentro da aba
    if (filtros.status.length > 0 && !filtros.status.includes(t.status)) return false

    // Range de datas (compara ISO derivado do mock com inicio/fim do filtro)
    if (filtros.data_inicio || filtros.data_fim) {
      const isoT = dateMockToISO(t.date)
      if (!isoT) return false
      if (filtros.data_inicio && isoT < filtros.data_inicio) return false
      if (filtros.data_fim    && isoT > filtros.data_fim)    return false
    }

    if (filtros.prioridades.length > 0 && !filtros.prioridades.includes(t.priority)) return false

    if (filtros.equipe === 'sem' && t.team) return false
    if (filtros.equipe === 'com') {
      if (!t.team) return false
      if (filtros.equipe_id && t.team !== filtros.equipe_id) return false
    }

    if (filtros.secretaria || filtros.divisao) {
      const p = parseClient(t.client)
      if (filtros.secretaria && p.secretaria !== filtros.secretaria) return false
      if (filtros.divisao    && p.divisao    !== filtros.divisao)    return false
    }

    if (query) {
      const q = query.toLowerCase()
      if (![t.code, t.title, t.client, t.address].join(" ").toLowerCase().includes(q)) return false
    }
    return true
  })

  const ordered = [...filtered].sort(
    (a, b) => (a.priority === "urgente" ? -1 : 0) - (b.priority === "urgente" ? -1 : 0)
  )

  // Quando na aba "Enviado p/ terceirizada", explode cada chamado em N linhas
  // (uma por ChamadoTerceirizada - uma por terceirizada vinculada).
  // Aplica também o sub-filtro de empresa.
  const terceirizadasFlatten = useMemo(() => {
    if (!aba) return []
    const linhas = []
    filtered.forEach((t) => {
      if (!Array.isArray(t.terceirizadas)) return
      t.terceirizadas.forEach((x) => {
        if (filtroTerc && x.empresa !== filtroTerc) return
        linhas.push({
          ...x,
          chamado_interno: t,   // referência completa ao Chamado pai
        })
      })
    })
    return linhas
  }, [filtered, aba, filtroTerc])

  const counts = useMemo(() => {
    const c = { todos: tickets.length, abertos: 0, finalizados: 0, com_terceirizada: 0 }
    tickets.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1
      if (STATUS_ABERTOS.includes(t.status)) c.abertos++
      if (STATUS_FINALIZADOS.includes(t.status)) c.finalizados++
      if (Array.isArray(t.terceirizadas) && t.terceirizadas.length > 0) c.com_terceirizada++
    })
    return c
  }, [tickets])

  const tercCounts = useMemo(() => {
    const c = {}
    tickets.forEach((t) => {
      if (Array.isArray(t.terceirizadas)) {
        t.terceirizadas.forEach((x) => {
          c[x.empresa] = (c[x.empresa] || 0) + 1
        })
      }
    })
    return c
  }, [tickets])
  const empresasDistintas = Object.keys(tercCounts).sort()

  const filtrosAtivos =
    ((filtros.data_inicio || filtros.data_fim) ? 1 : 0) +
    (filtros.prioridades.length > 0 ? 1 : 0) +
    (filtros.status.length > 0 ? 1 : 0) +
    (filtros.equipe !== 'todas' ? 1 : 0) +
    (filtros.secretaria ? 1 : 0) +
    (filtros.divisao ? 1 : 0)

  const chipsAplicados = []
  if (filtros.data_inicio || filtros.data_fim) {
    const ini = filtros.data_inicio ? formatBR(filtros.data_inicio) : '…'
    const fim = filtros.data_fim    ? formatBR(filtros.data_fim)    : '…'
    chipsAplicados.push({
      key: 'data',
      label: `Período: ${ini} → ${fim}`,
      remover: () => setFiltros((f) => ({ ...f, data_inicio: '', data_fim: '' })),
    })
  }
  if (filtros.prioridades.length > 0) {
    chipsAplicados.push({
      key: 'prio',
      label: `Prioridade: ${filtros.prioridades.map((p) => PRIORITY_META[p].label).join(', ')}`,
      remover: () => setFiltros((f) => ({ ...f, prioridades: [] })),
    })
  }
  if (filtros.status.length > 0) {
    chipsAplicados.push({
      key: 'status',
      label: `Status: ${filtros.status.map((s) => STATUS_META[s].curto || STATUS_META[s].label).join(', ')}`,
      remover: () => setFiltros((f) => ({ ...f, status: [] })),
    })
  }
  if (filtros.equipe !== 'todas') {
    const txt = filtros.equipe === 'sem'
      ? 'Sem equipe'
      : `Equipe: ${filtros.equipe_id ? (teams.find((e) => e.id === filtros.equipe_id)?.name || filtros.equipe_id) : 'qualquer'}`
    chipsAplicados.push({
      key: 'equipe',
      label: txt,
      remover: () => setFiltros((f) => ({ ...f, equipe: 'todas', equipe_id: null })),
    })
  }
  if (filtros.secretaria) {
    chipsAplicados.push({
      key: 'sec',
      label: `Secretaria: ${filtros.secretaria}${filtros.divisao ? ` · ${filtros.divisao}` : ''}`,
      remover: () => setFiltros((f) => ({ ...f, secretaria: '', divisao: '' })),
    })
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border2}`,
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
      }}
    >
      {/* Linha 1: chips de status */}
      <div
        className="px-4 py-3 flex items-center gap-2 flex-wrap"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        {STATUS_CHIPS.map((c) => {
          const ativo = statusFilter === c.id
          return (
            <button
              key={c.id}
              onClick={() => trocarAba(c.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
              style={
                ativo
                  ? { backgroundColor: '#eef0ff', color: '#2d2783', border: '1px solid #c7d2fe' }
                  : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
              }
            >
              {c.label}
              <span
                className="px-1 rounded text-[10px] font-semibold"
                style={{
                  backgroundColor: '#ffffff',
                  color: ativo ? '#2d2783' : C.text3,
                  border: `1px solid ${ativo ? '#c7d2fe' : C.border}`,
                }}
              >
                {counts[c.id] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Sub-filtro por empresa terceirizada */}
      {statusFilter === 'com_terceirizada' && empresasDistintas.length > 0 && (
        <div
          className="px-4 py-2 flex items-center gap-2 flex-wrap"
          style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.surface2 }}
        >
          <span className="text-[10px] uppercase tracking-wider font-medium mr-1" style={{ color: C.text3 }}>
            Empresa:
          </span>
          <SubChip
            ativo={filtroTerc === null}
            onClick={() => setFiltroTerc(null)}
            label="Todas"
            count={empresasDistintas.reduce((acc, k) => acc + tercCounts[k], 0)}
          />
          {empresasDistintas.map((emp) => {
            const meta = TERCEIRIZADAS_META[emp] || {}
            return (
              <SubChip
                key={emp}
                ativo={filtroTerc === emp}
                onClick={() => setFiltroTerc(emp)}
                label={emp}
                count={tercCounts[emp]}
                cor={meta.dot}
              />
            )
          })}
        </div>
      )}

      {/* Linha 2: busca + filtros avançados */}
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="relative flex-1 max-w-xl">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            strokeWidth={1.75}
            style={{ color: C.text3 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar chamado, setor, endereço…"
            className="w-full pl-9 pr-9 py-2 text-[13px] rounded-md focus:outline-none transition-colors"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border2}`,
              color: C.text1,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.accent
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}1a`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border2
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center"
              style={{ color: C.text3 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        <button
          onClick={() => setPainelAberto((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors"
          style={
            painelAberto || filtrosAtivos > 0
              ? { backgroundColor: '#eef0ff', color: '#2d2783', border: '1px solid #c7d2fe' }
              : { backgroundColor: C.surface, color: C.text2, border: `1px solid ${C.border2}` }
          }
          onMouseEnter={(e) => {
            if (!painelAberto && filtrosAtivos === 0) {
              e.currentTarget.style.backgroundColor = C.hover
              e.currentTarget.style.color = C.text1
            }
          }}
          onMouseLeave={(e) => {
            if (!painelAberto && filtrosAtivos === 0) {
              e.currentTarget.style.backgroundColor = C.surface
              e.currentTarget.style.color = C.text2
            }
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
          Filtros avançados
          {filtrosAtivos > 0 && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none"
              style={{ backgroundColor: C.accent, color: '#fff' }}
            >
              {filtrosAtivos}
            </span>
          )}
        </button>
      </div>

      {/* Painel inline de filtros avançados - desce uma aba */}
      <FiltrosAvancados
        open={painelAberto}
        onClose={() => setPainelAberto(false)}
        filtros={filtros}
        setFiltros={setFiltros}
        parsedSecretarias={parsedSecretarias}
        equipes={teams}
        statusDisponiveis={statusDisponiveis}
      />

      {/* Chips de filtros avançados aplicados */}
      {chipsAplicados.length > 0 && (
        <div
          className="px-4 py-2 flex items-center gap-1.5 flex-wrap"
          style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.surface2 }}
        >
          {chipsAplicados.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px]"
              style={{ backgroundColor: '#eef0ff', color: '#2d2783', border: '1px solid #c7d2fe' }}
            >
              {chip.label}
              <button
                onClick={chip.remover}
                className="w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ml-0.5"
                style={{ color: '#2d2783' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c7d2fe')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                aria-label="Remover filtro"
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFiltros(DEFAULT_FILTROS)}
            className="text-[11px] underline ml-1 transition-colors"
            style={{ color: C.text2 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text1)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text2)}
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Tabela - alterna entre Chamados internos e ChamadoTerceirizada */}
      <div>
        {aba ? (
          <TabelaTerceirizadas
            linhas={terceirizadasFlatten}
            onAbrirTerc={setOpenTerc}
            onAbrirInterno={onOpen}
          />
        ) : (
          <TabelaChamados
            linhas={ordered}
            onOpen={onOpen}
            onUpdate={onUpdate}
          />
        )}
      </div>

      {openTerc && (
        <TerceirizadaModal
          item={openTerc}
          onClose={() => setOpenTerc(null)}
          onAbrirInterno={(ticket) => {
            setOpenTerc(null)
            onOpen(ticket)
          }}
        />
      )}
    </div>
  )
}

// Chip normal que vira <select> ao clicar - edição rápida sem abrir o modal.
// O <select> fica invisível por cima do chip, então o visual não muda.
function SelectInline({ valor, opcoes, rotulo, onChange, render }) {
  return (
    <div className="relative inline-block group/sel" title="Clique para alterar">
      {render}
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Alterar"
      >
        {opcoes.map((o) => (
          <option key={o} value={o}>{rotulo(o)}</option>
        ))}
      </select>
    </div>
  )
}

function TabelaChamados({ linhas, onOpen, onUpdate }) {
  return (
    <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border2}` }}>
          <Th>Código</Th>
          <Th>Chamado</Th>
          <Th>Endereço</Th>
          <Th>Prioridade</Th>
          <Th>Status</Th>
          <Th>Setor solicitante</Th>
          <Th>Aberto</Th>
        </tr>
      </thead>
      <tbody>
        {linhas.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-[12px]" style={{ color: C.text3 }}>
              Nenhum chamado para os filtros aplicados.
            </td>
          </tr>
        ) : (
          linhas.map((t) => (
            <tr
              key={t.code}
              onClick={() => onOpen(t)}
              className="cursor-pointer transition-colors"
              style={{
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: t.priority === 'urgente' ? '#fef2f2' : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = t.priority === 'urgente' ? '#fee2e2' : C.hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = t.priority === 'urgente' ? '#fef2f2' : 'transparent'
              }}
            >
              <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.text1 }}>{t.code}</td>
              <td className="px-4 py-2.5" style={{ color: C.text1, maxWidth: 220 }} title={t.title}>
                <div className="truncate">{t.title}</div>
              </td>
              {/* interno/externo é o que decide se a equipe precisa se deslocar.
                  maxWidth trava a coluna: endereço comprido vira "…" (o
                  completo fica no title, ao passar o mouse) em vez de espremer
                  as colunas vizinhas */}
              <td className="px-4 py-2.5" style={{ color: C.text2, maxWidth: 240 }} title={t.address}>
                <div className="flex items-center gap-2 min-w-0">
                  <LocalChamado chamado={t} compacto />
                  <span className="truncate">{t.address}</span>
                </div>
              </td>
              <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                {onUpdate
                  ? <SelectInline
                      valor={t.priority}
                      opcoes={['urgente', 'alta', 'media', 'baixa']}
                      rotulo={(p) => PRIORITY_META[p].label}
                      onChange={(p) => onUpdate(t, { priority: p })}
                      render={<PriorityCell p={t.priority} escalonada={t.urgenciaEscalonada} dias={t.diasEmAberto} />}
                    />
                  : <PriorityCell p={t.priority} escalonada={t.urgenciaEscalonada} dias={t.diasEmAberto} />}
              </td>
              <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                {onUpdate
                  ? <SelectInline
                      valor={t.statusReal}
                      opcoes={STATUS_EDITAVEIS}
                      rotulo={(s) => STATUS_META[s].label}
                      onChange={(s) => onUpdate(t, { status: s })}
                      render={<StatusChip s={t.status} terceirizadas={t.terceirizadas} />}
                    />
                  : <StatusChip s={t.status} terceirizadas={t.terceirizadas} />}
              </td>
              {/* mesma regra do endereço: trunca com "…" e o nome inteiro no title */}
              <td className="px-4 py-2.5" style={{ color: C.text2, maxWidth: 200 }} title={t.client}>
                <div className="truncate">{t.client}</div>
              </td>
              <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap" style={{ color: C.text3 }}>
                {t.date} · {t.openedAt}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

function TabelaTerceirizadas({ linhas, onAbrirTerc, onAbrirInterno }) {
  return (
    <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border2}` }}>
          <Th center>Protocolo</Th>
          <Th center>Código interno</Th>
          <Th>Chamado</Th>
          <Th center>Empresa</Th>
          <Th>Status</Th>
          <Th>Setor solicitante</Th>
          <Th>Aberto</Th>
        </tr>
      </thead>
      <tbody>
        {linhas.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-[12px]" style={{ color: C.text3 }}>
              Nenhum chamado delegado para os filtros aplicados.
            </td>
          </tr>
        ) : (
          linhas.map((x) => {
            const ti = x.chamado_interno
            const empMeta = TERCEIRIZADAS_META[x.empresa] || {}
            const sm = TERC_STATUS_META[x.status_chamado] || {}
            return (
              <tr
                key={`${x.empresa}-${x.protocolo}`}
                style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                type="button"
                onClick={(ev) => { ev.stopPropagation(); onAbrirTerc(x) }}
>
                <td className="px-4 py-2.5 text-center">
                  <button
                    className="font-mono font-semibold  underline-offset-2 hover:no-underline transition-colors"
                    style={{ color: '#2d2783' }}
                  >
                    {x.protocolo}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={(ev) => { ev.stopPropagation(); onAbrirInterno(ti) }}
                    className="font-mono font-semibold underline underline-offset-2 hover:no-underline transition-colors"
                    style={{ color: C.text1 }}
                  >
                    {ti.code}
                  </button>
                </td>
                <td className="px-4 py-2.5" style={{ color: C.text1 }}>{ti.title}</td>
                <td className="px-4 py-2.5 text-center">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight"
                    style={{ backgroundColor: empMeta.bg, color: empMeta.fg, border: `1px solid ${empMeta.dot}55` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: empMeta.dot }} />
                    {x.empresa}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight leading-none whitespace-nowrap"
                    style={{
                      backgroundColor: sm.bg,
                      color: sm.fg,
                      boxShadow: '0 1px 2px rgba(20,22,36,0.06)',
                      minWidth: 92,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sm.dot }} />
                    {sm.label}
                  </span>
                </td>
                <td className="px-4 py-2.5" style={{ color: C.text2 }}>{ti.client}</td>
                <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: C.text3 }}>
                  {x.aberto_em}
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}

function formatBR(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function Th({ children, center }) {
  return (
    <th
      className={`px-4 py-2.5 ${center ? 'text-center' : 'text-left'} text-[10px] uppercase tracking-wider font-medium`}
      style={{ color: C.text3 }}
    >
      {children}
    </th>
  )
}

function SubChip({ ativo, onClick, label, count, cor }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors"
      style={
        ativo
          ? { backgroundColor: '#ffffff', color: C.text1, border: `1px solid ${C.border2}`, boxShadow: '0 1px 2px rgba(20,22,36,0.06)' }
          : { backgroundColor: 'transparent', color: C.text2, border: `1px solid transparent` }
      }
    >
      {cor && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />}
      {label}
      <span className="font-semibold text-[10px]" style={{ color: C.text3 }}>{count}</span>
    </button>
  )
}
