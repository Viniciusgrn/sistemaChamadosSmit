import { useMemo, useState } from "react"
import {
  Ticket as TicketIcon,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Plus,
  Check,
  Users,
  Loader2,
} from 'lucide-react'

import KpiCard            from "../../components/chamados/KpiCard"
import TeamCard           from "../../components/chamados/TeamCard"
import TicketsTable       from "../../components/chamados/TicketsTable"
import TicketModal        from "../../components/chamados/TicketModal"
import AssignModal        from "../../components/chamados/AssignModal"
import NewTicketModal     from "../../components/chamados/NewTicketModal"
import MapaChamadosModal  from "../../components/chamados/MapaChamadosModal"

import { PRIORITY_META, STATUS_META } from "./data"
import { INT_POR_PRIORIDADE, INT_POR_STATUS } from "./adapters"
import {
  useChamadosDIT, useAtualizarChamado, useAbrirChamado,
  useAtenderChamado, useEncerrarAtendimento,
} from "../../hooks/useChamados"
import { useEquipesAtivas, useDespacharEquipe } from "../../hooks/useEquipes"
import { useAuth } from "../../contexts/AuthContext"
import { mensagemErro } from "../../api/erros"
import EncerrarAtendimentoModal from "../../components/chamados/EncerrarAtendimentoModal"

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

export default function Chamado() {
  const { data: tickets = [], isLoading, isError, error } = useChamadosDIT()
  const { data: teams = [] } = useEquipesAtivas()
  const atualizar = useAtualizarChamado()
  const abrir = useAbrirChamado()
  const atender = useAtenderChamado()
  const encerrarAtendimento = useEncerrarAtendimento()
  const despachar = useDespacharEquipe()
  const { user } = useAuth()

  const [query, setQuery]               = useState("")
  const [openTicket, setOpenTicket]     = useState(null)
  const [assignTicket, setAssignTicket] = useState(null)
  const [newTicket, setNewTicket]       = useState(false)
  const [mapaAberto, setMapaAberto]     = useState(false)
  const [toasts, setToasts]             = useState([])
  const [periodo, setPeriodo]           = useState('Hoje')
  // troca de chamado pendente de confirmação { atual, destino }
  const [trocaPendente, setTrocaPendente] = useState(null)
  // chamado cujo atendimento o técnico está encerrando
  const [encerrandoAtendimento, setEncerrandoAtendimento] = useState(null)

  // "encerrado" = resolvido ou cancelado (saiu da fila)
  const encerrado = (t) => t.statusReal === 'resolvido' || t.statusReal === 'cancelado'

  const kpi = useMemo(() => calculaKpis(tickets, periodo, encerrado), [tickets, periodo])

  const pushToast = (msg) => {
    const id = Math.random()
    setToasts(s => [...s, { id, msg }])
    setTimeout(() => setToasts(s => s.filter(t => t.id !== id)), 2600)
  }


  // Persiste prioridade/status. `patch` usa as chaves visuais; converte pros ints da API.
  const updateTicket = (ticket, patch) => {
    const body = {}
    if (patch.priority) body.urgencia = INT_POR_PRIORIDADE[patch.priority]
    if (patch.status) body.status_chamado = INT_POR_STATUS[patch.status]
    // ao agendar, a data/hora viaja junto com o status
    if (patch.agendadoPara) body.agendado_para = new Date(patch.agendadoPara).toISOString()
    if (Object.keys(body).length === 0) return

    atualizar.mutate({ id: ticket.id, ...body }, {
      onSuccess: () => {
        if (patch.priority) {
          pushToast(`#${ticket.code} · prioridade alterada para "${PRIORITY_META[patch.priority].label}"`)
        }
        if (patch.status) {
          pushToast(`#${ticket.code} · status alterado`)
        }
        // mantém o modal aberto refletindo o novo valor (statusReal é a chave
        // que o modal usa pra destacar o status ativo)
        setOpenTicket(prev => (
          prev && prev.id === ticket.id
            ? { ...prev, ...patch, ...(patch.status ? { statusReal: patch.status } : {}) }
            : prev
        ))
      },
      onError: (e) => pushToast(mensagemErro(e, 'Não foi possível salvar a alteração.')),
    })
  }

  const assignTeam = (team) => {
    const t = assignTicket
    if (!t) return
    // Despachar é o que de fato vincula: grava chamado_atual na equipe e abre o
    // Atendimento. O status "Em andamento" vem junto, pelo próprio backend -
    // só mudar o status deixaria o chamado sem equipe nenhuma.
    despachar.mutate(
      { id: team.id, chamadoId: t.id },
      {
        onSuccess: () => pushToast(`${team.name} atribuída ao #${t.code}`),
        onError: (e) => pushToast(mensagemErro(e, 'Não foi possível atribuir a equipe.')),
      }
    )
    setAssignTicket(null)
  }

  const createTicket = (form) => {
    abrir.mutate(
      {
        titulo: form.title,
        descricao: form.description || '',
        unidade_id: form.unidade_id,
        urgencia: INT_POR_PRIORIDADE[form.priority] ?? 0,
        // o chamado fica no nome do servidor escolhido; created_by registra
        // quem da TI digitou
        solicitante_id: form.solicitante_id || undefined,
        nome_solicitante: form.nome_solicitante || '',
        // pode nascer agendado: status + data viajam juntos
        ...(form.status === 'agendado' && form.agendadoPara
          ? {
              status_chamado: INT_POR_STATUS.agendado,
              agendado_para: new Date(form.agendadoPara).toISOString(),
            }
          : {}),
      },
      {
        onSuccess: (novo) => {
          setNewTicket(false)
          pushToast(
            form.status === 'agendado'
              ? `Chamado #${novo.id} criado · agendado`
              : `Chamado #${novo.id} criado · aguardando atribuição`
          )
        },
        onError: (e) => pushToast(mensagemErro(e, 'Erro ao criar o chamado.')),
      }
    )
  }

  // ---- atendimento do técnico logado ----
  // chamado que ele já está atendendo (só pode haver um)
  const meuChamadoAtual = useMemo(() => {
    if (!user?.tecnico_id) return null
    return tickets.find((t) => t.equipeTecnicoIds?.includes(user.tecnico_id)) || null
  }, [tickets, user])

  const pedirAtendimento = (ticket) => {
    // já está em outro chamado: confirma a troca e pergunta o status do atual
    if (meuChamadoAtual && meuChamadoAtual.id !== ticket.id) {
      setTrocaPendente({ atual: meuChamadoAtual, destino: ticket })
      return
    }
    atender.mutate({ id: ticket.id }, {
      onSuccess: () => pushToast(`Você assumiu o #${ticket.code}`),
      onError: (e) => pushToast(mensagemErro(e, 'Não foi possível assumir o chamado.')),
    })
  }

  const confirmarTroca = ({ status, observacoes, instrucoes }) => {
    const { atual, destino } = trocaPendente
    atender.mutate(
      { id: destino.id, statusAnterior: INT_POR_STATUS[status], observacoes, instrucoes },
      {
        onSuccess: () => {
          setTrocaPendente(null)
          pushToast(`#${atual.code} ficou como "${STATUS_META[status].label}" · você está no #${destino.code}`)
        },
        onError: (e) => pushToast(mensagemErro(e, 'Não foi possível trocar de chamado.')),
      }
    )
  }

  const confirmarEncerramento = ({ status, observacoes, instrucoes }) => {
    const alvo = encerrandoAtendimento
    encerrarAtendimento.mutate(
      { id: alvo.id, status: INT_POR_STATUS[status], observacoes, instrucoes },
      {
        onSuccess: () => {
          setEncerrandoAtendimento(null)
          pushToast(`Atendimento encerrado · #${alvo.code} ficou como "${STATUS_META[status].label}"`)
        },
        onError: (e) => pushToast(mensagemErro(e, 'Não foi possível encerrar o atendimento.')),
      }
    )
  }

  const equipesEmCampo = teams.filter(t => t.status === "em_atendimento").length

  return (
    <div className="min-h-full" style={{ backgroundColor: C.bg }}>
      <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Page head */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="m-0 text-[26px] font-bold tracking-tight"
              style={{ color: C.text1, letterSpacing: '-0.02em' }}
            >
              Chamados
            </h1>
            <div className="text-[13.5px] mt-1" style={{ color: C.text2 }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>

          {/* Seletor de período */}
          <div
            className="inline-flex items-center gap-0.5 p-0.5 rounded-md"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            {['Hoje', 'Semana', 'Mês'].map((p) => {
              const ativo = periodo === p
              return (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className="px-3 py-1 rounded text-[12px] font-semibold transition-colors"
                  style={
                    ativo
                      ? { backgroundColor: C.surface2, color: C.text1, boxShadow: 'inset 0 0 0 1px #ececea' }
                      : { backgroundColor: 'transparent', color: C.text2 }
                  }
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label={`Chamados abertos · ${periodo.toLowerCase()}`}
            Icon={AlertOctagon}
            value={kpi.abertos}
            delta={kpi.abertosDelta}
            // mais chamados abertos não é bom: sobe = vermelho
            deltaDir={kpi.abertos > 0 && kpi.abertosDelta.startsWith('+') ? 'down' : 'neutro'}
          />
          <KpiCard
            label={`Resolvidos · ${periodo.toLowerCase()}`}
            Icon={CheckCircle2}
            value={kpi.resolvidos}
            delta={kpi.resolvidosDelta}
            deltaDir={kpi.resolvidosDelta.startsWith('+') ? 'up' : 'neutro'}
          />
          <KpiCard
            label="Chamados não concluídos"
            Icon={TicketIcon}
            value={kpi.naoConcluidos}
            delta={kpi.naoConcluidosDetalhe}
            deltaDir={kpi.naoConcluidos > 0 ? 'down' : 'up'}
          />
          <KpiCard
            label="Urgentes ativos"
            Icon={AlertTriangle}
            value={kpi.urgentes}
            delta={kpi.urgentesDetalhe}
            deltaDir={kpi.urgentes > 0 ? 'down' : 'up'}
          />
        </div>

        {/* Seção: Equipes ativas */}
        <section>
          <SectionHead
            titulo="Equipes ativas"
            pill={`${equipesEmCampo} em campo`}
          >
            <button
              onClick={() => setMapaAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ color: C.text2 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.surface2; e.currentTarget.style.color = C.text1 }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
            >
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
              Ver mapa
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ backgroundColor: C.surface, color: C.text1, border: `1px solid ${C.border2}` }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.surface)}
            >
              Gerenciar equipes
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </SectionHead>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => <TeamCard key={t.id} team={t} />)}
          </div>
        </section>

        {/* Seção: Lista de chamados */}
        <section>
          <SectionHead
            titulo="Lista de chamados"
            pill={`${tickets.length} no total`}
          >
            <button
              onClick={() => setNewTicket(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ backgroundColor: C.accent, color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Novo chamado
            </button>
          </SectionHead>

          {isLoading ? (
            <EstadoLista texto="Carregando chamados…" spin />
          ) : isError ? (
            <EstadoLista
              texto={
                error?.status === 401 || error?.status === 403
                  ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                  : `Erro ao carregar chamados${error?.status ? ` (${error.status})` : ''}.`
              }
            />
          ) : (
            <TicketsTable
              tickets={tickets}
              teams={teams}
              query={query}
              setQuery={setQuery}
              onOpen={setOpenTicket}
              onUpdate={updateTicket}
            />
          )}
        </section>
      </div>

      {/* Modais */}
      {openTicket && (
        <TicketModal
          ticket={tickets.find((t) => t.id === openTicket.id) || openTicket}
          teams={teams}
          onClose={() => setOpenTicket(null)}
          onUpdate={updateTicket}
          onAssign={(t) => setAssignTicket(t)}
          onAtender={() => pedirAtendimento(openTicket)}
          onEncerrarAtendimento={() => setEncerrandoAtendimento(openTicket)}
        />
      )}

      {/* Trocar de chamado: decide o que fica no que ele está largando */}
      {trocaPendente && (
        <EncerrarAtendimentoModal
          chamadoAtual={trocaPendente.atual}
          destino={trocaPendente.destino}
          onConfirmar={confirmarTroca}
          onClose={() => setTrocaPendente(null)}
          salvando={atender.isPending}
          erro={atender.error ? mensagemErro(atender.error, '') : ''}
        />
      )}

      {/* Encerrar o próprio atendimento (sair ≠ resolver) */}
      {encerrandoAtendimento && (
        <EncerrarAtendimentoModal
          chamadoAtual={encerrandoAtendimento}
          onConfirmar={confirmarEncerramento}
          onClose={() => setEncerrandoAtendimento(null)}
          salvando={encerrarAtendimento.isPending}
          erro={encerrarAtendimento.error ? mensagemErro(encerrarAtendimento.error, '') : ''}
        />
      )}
      {assignTicket && (
        <AssignModal
          ticket={assignTicket}
          teams={teams}
          onClose={() => setAssignTicket(null)}
          onPick={assignTeam}
        />
      )}
      {newTicket && (
        <NewTicketModal onClose={() => setNewTicket(false)} onCreate={createTicket} />
      )}
      {mapaAberto && (
        <MapaChamadosModal
          tickets={tickets}
          teams={teams}
          onClose={() => setMapaAberto(false)}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-md px-3 py-2 text-[12px] flex items-center gap-2 animate-slide-in"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border2}`,
              boxShadow: '0 12px 32px -8px rgba(20,22,36,0.18), 0 2px 6px rgba(20,22,36,0.06)',
              color: C.text1,
              minWidth: 240,
            }}
          >
            <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} style={{ color: '#22c55e' }} />
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

// Janela do período selecionado + a MESMA janela deslocada pro período anterior
// (hoje vs. ontem até esta hora; esta semana vs. a anterior até o mesmo ponto).
// Tudo em cima de created_at real; nada estimado.
const DIAS_POR_PERIODO = { Hoje: 1, Semana: 7, 'Mês': 30 }

function janelas(periodo) {
  const dias = DIAS_POR_PERIODO[periodo] || 1
  const fim = new Date()
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)
  inicio.setDate(inicio.getDate() - (dias - 1))

  const desloca = (d) => {
    const x = new Date(d)
    x.setDate(x.getDate() - dias)
    return x
  }
  return { inicio, fim, inicioAnterior: desloca(inicio), fimAnterior: desloca(fim) }
}

function calculaKpis(tickets, periodo, encerrado) {
  const { inicio, inicioAnterior, fimAnterior } = janelas(periodo)

  const dentro = (t, de, ate) => {
    if (!t.created_at) return false
    const d = new Date(t.created_at)
    return d >= de && d < ate
  }
  const agora = new Date()

  const noPeriodo = tickets.filter((t) => dentro(t, inicio, agora))
  const noAnterior = tickets.filter((t) => dentro(t, inicioAnterior, fimAnterior))

  const resolvidosPeriodo = noPeriodo.filter((t) => t.statusReal === 'resolvido').length
  const resolvidosAnterior = noAnterior.filter((t) => t.statusReal === 'resolvido').length

  // pendências e urgentes são fotos do estado atual, não do período
  const pendentes = tickets.filter((t) => !encerrado(t))
  const urgentes = pendentes.filter((t) => t.priority === 'urgente')
  const maisAntigo = pendentes.reduce((acc, t) => {
    if (!t.created_at) return acc
    const d = new Date(t.created_at)
    return !acc || d < acc ? d : acc
  }, null)

  return {
    abertos: noPeriodo.length,
    abertosDelta: variacao(noPeriodo.length, noAnterior.length, periodo),
    resolvidos: resolvidosPeriodo,
    resolvidosDelta: variacao(resolvidosPeriodo, resolvidosAnterior, periodo),
    naoConcluidos: pendentes.length,
    naoConcluidosDetalhe: maisAntigo
      ? `mais antigo há ${diasAtras(maisAntigo)}`
      : 'nenhum pendente',
    urgentes: urgentes.length,
    urgentesDetalhe: urgentes.length === 0
      ? 'nada crítico na fila'
      : `${urgentes.filter((t) => !t.team).length} sem equipe`,
  }
}

// "+3 vs. período anterior" / "sem comparação" quando não há histórico
function variacao(atual, anterior, periodo) {
  const rotulo =
    periodo === 'Hoje' ? 'vs. ontem'
      : periodo === 'Semana' ? 'vs. 7 dias anteriores'
      : 'vs. 30 dias anteriores'
  if (anterior === 0) {
    return atual === 0 ? `nenhum ${rotulo}` : `sem base de comparação`
  }
  const dif = atual - anterior
  const pct = Math.round((dif / anterior) * 100)
  const sinal = dif > 0 ? '+' : ''
  return `${sinal}${dif} (${sinal}${pct}%) ${rotulo}`
}

function diasAtras(data) {
  const dias = Math.floor((Date.now() - data.getTime()) / 86400000)
  if (dias === 0) return 'menos de 1 dia'
  return dias === 1 ? '1 dia' : `${dias} dias`
}

function EstadoLista({ texto, spin }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 rounded-lg"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text3 }}
    >
      {spin
        ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.75} />
        : <AlertTriangle className="w-6 h-6" strokeWidth={1.75} />}
      <span className="text-[13px] max-w-sm text-center">{texto}</span>
    </div>
  )
}

function SectionHead({ titulo, pill, children }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <h2 className="m-0 text-[16px] font-semibold tracking-tight flex items-center gap-2" style={{ color: C.text1 }}>
        {titulo}
        {pill && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
            style={{ backgroundColor: C.surface, color: C.text2, border: `1px solid ${C.border}` }}
          >
            {pill}
          </span>
        )}
      </h2>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  )
}
