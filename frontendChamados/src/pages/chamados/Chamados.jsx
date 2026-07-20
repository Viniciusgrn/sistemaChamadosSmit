import { useState } from "react"
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
} from 'lucide-react'

import KpiCard            from "../../components/chamados/KpiCard"
import TeamCard           from "../../components/chamados/TeamCard"
import TicketsTable       from "../../components/chamados/TicketsTable"
import TicketModal        from "../../components/chamados/TicketModal"
import AssignModal        from "../../components/chamados/AssignModal"
import NewTicketModal     from "../../components/chamados/NewTicketModal"
import MapaChamadosModal  from "../../components/chamados/MapaChamadosModal"

import { SEED_TEAMS, SEED_TICKETS, PRIORITY_META } from "./data"

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

export default function Chamado({
  initialTeams   = SEED_TEAMS,
  initialTickets = SEED_TICKETS,
}) {
  const [tickets, setTickets]           = useState(initialTickets)
  const [teams, setTeams]               = useState(initialTeams)
  const [query, setQuery]               = useState("")
  const [openTicket, setOpenTicket]     = useState(null)
  const [assignTicket, setAssignTicket] = useState(null)
  const [newTicket, setNewTicket]       = useState(false)
  const [mapaAberto, setMapaAberto]     = useState(false)
  const [toasts, setToasts]             = useState([])
  const [periodo, setPeriodo]           = useState('Hoje')

  const kpi = {
    abertosHoje: tickets.filter(t => t.date === "Hoje").length,
    resolvHoje:  tickets.filter(t => t.date === "Hoje" && t.status === "resolvido").length,
    urgentes:    tickets.filter(t => t.priority === "urgente" && t.status !== "resolvido").length,
    naoConcluidos: tickets.filter(t => t.status !== "resolvido").length,
  }

  const pushToast = (msg) => {
    const id = Math.random()
    setToasts(s => [...s, { id, msg }])
    setTimeout(() => setToasts(s => s.filter(t => t.id !== id)), 2600)
  }

  const updateTicket = (next) => {
    setTickets(s => s.map(t => t.code === next.code ? next : t))
    setOpenTicket(next)
    pushToast(`${next.code} · prioridade alterada para "${PRIORITY_META[next.priority].label}"`)
  }

  const assignTeam = (team) => {
    const t = assignTicket
    if (!t) return
    const next = { ...t, team: team.id, status: t.status === "aberto" ? "em_andamento" : t.status }
    setTickets(s => s.map(x => x.code === t.code ? next : x))
    setOpenTicket(prev => prev && prev.code === t.code ? next : prev)
    setAssignTicket(null)
    pushToast(`${team.name} atribuída a ${t.code}`)
  }

  const createTicket = (form) => {
    const num = 2853 + tickets.filter(t => /^28[5-9]/.test(t.code)).length
    const next = {
      code: String(num),
      title: form.title,
      client: form.client,                         // "Secretaria - Divisão"
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      priority: form.priority,
      status: "aberto",
      openedAt: "agora",
      team: null,
      date: "Hoje",
      usuario_solicitante: form.usuario_solicitante,
      description: form.description,
    }
    setTickets(s => [next, ...s])
    setNewTicket(false)
    pushToast(`CH-${next.code} criado · aguardando atribuição`)
  }

  const equipesEmCampo = teams.filter(t => t.status !== "pausa").length

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
              Operação em tempo real ·{" "}
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
            label="Chamados abertos hoje"
            Icon={AlertOctagon}
            value={kpi.abertosHoje}
            delta="-12% vs. ontem"
            deltaDir="up"
          />
          <KpiCard
            label="Resolvidos hoje"
            Icon={CheckCircle2}
            value={kpi.resolvHoje}
            delta="+3 desde o turno da manhã"
            deltaDir="up"
          />
          <KpiCard
            label="Chamados não concluídos"
            Icon={TicketIcon}
            value={kpi.naoConcluidos}
            delta={`${kpi.naoConcluidos} ainda em aberto !`}
            deltaDir="down"
          />
          <KpiCard
            label="Urgentes ativos"
            Icon={AlertTriangle}
            value={kpi.urgentes}
            delta="Atenção imediata"
            deltaDir="down"
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

          <TicketsTable
            tickets={tickets}
            teams={teams}
            query={query}
            setQuery={setQuery}
            onOpen={setOpenTicket}
          />
        </section>
      </div>

      {/* Modais */}
      {openTicket && (
        <TicketModal
          ticket={openTicket}
          teams={teams}
          onClose={() => setOpenTicket(null)}
          onUpdate={updateTicket}
          onAssign={(t) => setAssignTicket(t)}
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
