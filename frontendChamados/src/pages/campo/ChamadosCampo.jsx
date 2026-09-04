import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlayCircle, Lock, MapPin, Loader2, AlertCircle, Search, Users, Car, Map,
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import {
  useChamadosDIT, useAtenderChamado, useEncerrarAtendimento,
} from '../../hooks/useChamados'
import { useEquipesAtivas } from '../../hooks/useEquipes'
import { PRIORITY_META, STATUS_META } from '../chamados/data'
import { INT_POR_STATUS } from '../chamados/adapters'
import { STATUS_ABERTOS } from '../../components/chamados/TicketsTable'
import { LocalChamado } from '../../components/chamados/shared'
import EncerrarAtendimentoModal from '../../components/chamados/EncerrarAtendimentoModal'
import MapaChamadosModal from '../../components/chamados/MapaChamadosModal'
import { mensagemErro } from '../../api/erros'

const C = {
  bg:      '#f7f7f4',
  surface: '#ffffff',
  border:  '#e3e2df',
  divider: '#ececea',
  text1:   '#15161b',
  text2:   '#5b5e68',
  text3:   '#8b8d96',
  accent:  '#4f46e5',
}

export default function ChamadosCampo() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: chamados = [], isLoading, isError } = useChamadosDIT()
  const { data: equipes = [] } = useEquipesAtivas()
  const atender = useAtenderChamado()
  const encerrarAtendimento = useEncerrarAtendimento()

  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')
  const [mapaAberto, setMapaAberto] = useState(false)
  // 'fila' = precisa de atendimento | 'concluidos' = finalizados e cancelados
  const [aba, setAba] = useState('fila')
  // troca de chamado pendente de confirmação { atual, destino }
  const [troca, setTroca] = useState(null)

  const minhaEquipe = useMemo(
    () => equipes.find((e) => e.tecnicoIds?.includes(user?.tecnico_id)),
    [equipes, user]
  )
  const meuChamadoCode = minhaEquipe?.activeTicket?.code || null

  const abertos = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return chamados
      .filter((c) => STATUS_ABERTOS.includes(c.status))
      .filter((c) => !q || [c.code, c.title, c.client, c.address].join(' ').toLowerCase().includes(q))
      .sort((a, b) => ORDEM[b.priority] - ORDEM[a.priority])
  }, [chamados, busca])

  // já feitos: finalizados e cancelados, do mais recente pro mais antigo
  const concluidos = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return chamados
      .filter((c) => ['resolvido', 'cancelado'].includes(c.statusReal))
      .filter((c) => !q || [c.code, c.title, c.client, c.address].join(' ').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.finalizado_em || b.created_at) - new Date(a.finalizado_em || a.created_at))
  }, [chamados, busca])

  const kpis = useMemo(() => {
    const ativos = chamados.filter((c) => STATUS_ABERTOS.includes(c.status))
    return {
      naFila: ativos.length,
      urgentes: ativos.filter((c) => c.priority === 'urgente' || c.priority === 'alta').length,
      meus: meuChamadoCode ? 1 : 0,
    }
  }, [chamados, meuChamadoCode])

  const irPara = (chamado) => {
    setErro('')
    // já estou em outro chamado: trocar exige dizer em que status o atual fica
    if (meuChamadoCode && meuChamadoCode !== chamado.code) {
      const atual = chamados.find((c) => c.code === meuChamadoCode)
      setTroca({ atual, destino: chamado })
      return
    }
    atender.mutate(
      { id: chamado.id },
      {
        onSuccess: () => navigate('/chamado-atual'),
        onError: (e) => setErro(mensagemErro(e, 'Não foi possível assumir o chamado.')),
      }
    )
  }

  const confirmarTroca = ({ status, observacoes, instrucoes }) => {
    const { atual, destino } = troca
    atender.mutate(
      // o modal devolve a chave visual ('resolvido'); a API espera o inteiro
      { id: destino.id, statusAnterior: INT_POR_STATUS[status], observacoes, instrucoes },
      {
        onSuccess: () => { setTroca(null); navigate('/chamado-atual') },
        onError: (e) => setErro(mensagemErro(e, 'Não foi possível trocar de chamado.')),
      }
    )
  }

  if (isLoading) return <Estado icon={Loader2} spin texto="Carregando chamados…" />
  if (isError)   return <Estado icon={AlertCircle} texto="Erro ao carregar os chamados." />

  return (
    <div className="p-4 flex flex-col gap-3 pb-6">
      {/* KPIs — três números que cabem numa linha de celular */}
      <div className="grid grid-cols-3 gap-2">
        <Kpi valor={kpis.naFila}   label="na fila" />
        <Kpi valor={kpis.urgentes} label="urgentes" destaque={kpis.urgentes > 0} />
        <Kpi valor={kpis.meus}     label="meu" />
      </div>

      {/* Minha equipe */}
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <Users className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
        {minhaEquipe ? (
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium truncate" style={{ color: C.text1 }}>
              {minhaEquipe.name}
            </div>
            <div className="text-[11px] truncate flex items-center gap-1" style={{ color: C.text2 }}>
              {minhaEquipe.vehicle
                ? <><Car className="w-3 h-3" strokeWidth={1.75} />{minhaEquipe.vehicle.plate}</>
                : 'sem veículo · interno'}
              {meuChamadoCode && ` · atendendo #${meuChamadoCode}`}
            </div>
          </div>
        ) : (
          <div className="text-[12px] flex-1" style={{ color: C.text3 }}>
            Você não está em nenhuma equipe.
          </div>
        )}
      </div>

      {erro && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-[12px]"
          style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          {erro}
        </div>
      )}

      {/* Abas: a fila de trabalho e o histórico do que já foi feito */}
      <div
        className="flex rounded-lg p-1 gap-1"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        {[
          { valor: 'fila', rotulo: `Na fila (${abertos.length})` },
          { valor: 'concluidos', rotulo: `Concluídos (${concluidos.length})` },
        ].map((t) => (
          <button
            key={t.valor}
            onClick={() => setAba(t.valor)}
            className="flex-1 min-h-[40px] rounded-md text-[13px] font-medium transition-colors"
            style={
              aba === t.valor
                ? { backgroundColor: '#eef0ff', color: '#2d2783' }
                : { backgroundColor: 'transparent', color: C.text2 }
            }
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            strokeWidth={1.75}
            style={{ color: C.text3 }}
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar chamado, unidade, endereço…"
            className="w-full pl-9 pr-3 min-h-[44px] rounded-lg text-[13px] focus:outline-none"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text1 }}
          />
        </div>
        {/* mapa só das unidades que têm chamado aberto — não faz sentido na
            aba de concluídos */}
        {aba === 'fila' && (
          <button
            onClick={() => setMapaAberto(true)}
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text2 }}
            aria-label="Ver mapa dos chamados"
            title="Ver mapa dos chamados"
          >
            <Map className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {aba === 'fila' ? (
        abertos.length === 0 ? (
          <Estado icon={Search} texto="Nenhum chamado em aberto." />
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {abertos.map((c) => (
              <LinhaChamado
                key={c.id}
                chamado={c}
                euAtendo={meuChamadoCode === c.code}
                atendidoPorOutro={!!c.team && meuChamadoCode !== c.code}
                podeAtender={user?.pode_atender}
                ocupado={atender.isPending}
                onIr={() => irPara(c)}
              />
            ))}
          </ul>
        )
      ) : concluidos.length === 0 ? (
        <Estado icon={Search} texto="Nenhum chamado concluído ainda." />
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {concluidos.map((c) => (
            <LinhaConcluido key={c.id} chamado={c} onAbrir={() => navigate(`/chamados/${c.id}`)} />
          ))}
        </ul>
      )}

      {mapaAberto && (
        <MapaChamadosModal
          tickets={chamados}
          teams={equipes}
          onClose={() => setMapaAberto(false)}
        />
      )}

      {troca && (
        <EncerrarAtendimentoModal
          chamadoAtual={troca.atual}
          destino={troca.destino}
          onConfirmar={confirmarTroca}
          onClose={() => setTroca(null)}
          salvando={atender.isPending}
        />
      )}
    </div>
  )
}

const ORDEM = { baixa: 0, media: 1, alta: 2, urgente: 3 }

// Cartão de chamado JÁ FEITO: clicar abre a consulta (/chamados/<id>), no
// mesmo desenho da tela "Atual" — só leitura, sem botão de assumir.
function LinhaConcluido({ chamado, onAbrir }) {
  const st = STATUS_META[chamado.status] || {}
  const quando = chamado.finalizado_em
    ? new Date(chamado.finalizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : ''
  return (
    <li>
      <button
        onClick={onAbrir}
        className="w-full text-left rounded-xl p-3 flex flex-col gap-1.5"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-[11px] font-semibold" style={{ color: C.text3 }}>
              #{chamado.code}
            </div>
            <div className="text-[14px] font-medium leading-snug" style={{ color: C.text1 }}>
              {chamado.title}
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 whitespace-nowrap"
            style={{ backgroundColor: st.bg, color: st.fg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
            {st.curto || st.label}
          </span>
        </div>
        <div className="text-[12px] flex items-center gap-2 flex-wrap" style={{ color: C.text3 }}>
          <span className="min-w-0 truncate">{chamado.client}</span>
          {quando && <span>· {quando}</span>}
        </div>
      </button>
    </li>
  )
}

// Cartão em vez de linha de tabela: no celular a tabela obriga scroll lateral
function LinhaChamado({ chamado, euAtendo, atendidoPorOutro, podeAtender, ocupado, onIr }) {
  const prio = PRIORITY_META[chamado.priority] || {}
  const st = STATUS_META[chamado.status] || {}

  return (
    <li
      className="rounded-xl p-3 flex flex-col gap-2.5"
      style={{ backgroundColor: C.surface, border: `1px solid ${euAtendo ? C.accent : C.border}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-semibold" style={{ color: C.text3 }}>
            #{chamado.code}
          </div>
          <div className="text-[14px] font-medium leading-snug" style={{ color: C.text1 }}>
            {chamado.title}
          </div>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 whitespace-nowrap"
          style={{ backgroundColor: prio.bg, color: prio.fg }}
        >
          {prio.label}
          {chamado.urgenciaEscalonada ? ' ↑' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-[12px]" style={{ color: C.text2 }}>
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.75} style={{ color: C.text3 }} />
          <span className="min-w-0 break-words">{chamado.client}</span>
        </div>
        {/* saber se precisa sair do prédio vem antes de qualquer outra coisa */}
        <LocalChamado chamado={chamado} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ backgroundColor: st.bg, color: st.fg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
          {st.curto || st.label}
        </span>

        {/* O botão mora na própria linha: é a ação principal do técnico */}
        {!podeAtender ? null : euAtendo ? (
          <span
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-lg text-[12px] font-semibold"
            style={{ backgroundColor: '#eef0ff', color: '#2d2783' }}
          >
            <PlayCircle className="w-4 h-4" strokeWidth={1.75} />
            Você está aqui
          </span>
        ) : atendidoPorOutro ? (
          <span
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-lg text-[12px] font-medium"
            style={{ backgroundColor: '#f3f2ee', color: C.text3 }}
            title={chamado.equipe?.name ? `Em atendimento por ${chamado.equipe.name}` : 'Em atendimento'}
          >
            <Lock className="w-4 h-4" strokeWidth={1.75} />
            Em atendimento
          </span>
        ) : (
          <button
            onClick={onIr}
            disabled={ocupado}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-lg text-[12px] font-semibold"
            style={{ backgroundColor: '#0284c7', color: '#fff', opacity: ocupado ? 0.6 : 1 }}
          >
            <PlayCircle className="w-4 h-4" strokeWidth={2} />
            Ir para o chamado
          </button>
        )}
      </div>
    </li>
  )
}

function Kpi({ valor, label, destaque }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-center"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${destaque ? '#fecaca' : C.border}`,
      }}
    >
      <div className="text-[20px] font-semibold leading-none" style={{ color: destaque ? '#b91c1c' : C.text1 }}>
        {valor}
      </div>
      <div className="text-[10px] mt-1" style={{ color: C.text3 }}>{label}</div>
    </div>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon className={`w-7 h-7 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.5} style={{ color: C.text3 }} />
      <div className="text-[13px]" style={{ color: C.text2 }}>{texto}</div>
    </div>
  )
}
