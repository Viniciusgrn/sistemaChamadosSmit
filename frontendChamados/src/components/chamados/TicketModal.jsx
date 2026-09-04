import { useEffect, useState } from "react"
import { X, Users, Check, Plus, Trash2, Briefcase, PlayCircle, StopCircle, Lock, MessageSquare } from 'lucide-react'
import { Avatar, PriorityCell, StatusChip, LocalChamado } from "./shared"
import HistoricoEquipesModal from "./HistoricoEquipesModal"
import {
  PRIORITY_META, TERCEIRIZADAS_META, TERC_STATUS_META, TERC_STATUS,
  STATUS_META, STATUS_EDITAVEIS,
} from "../../pages/chamados/data"
import {
  useEmpresas, useDelegarChamado, useEditarDelegacao, useRemoverDelegacao,
} from "../../hooks/useTerceirizadas"
import { useAtenderChamado } from "../../hooks/useChamados"
import { useAuth } from "../../contexts/AuthContext"

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

export default function TicketModal({ ticket, teams, onClose, onUpdate, onAssign, onAtender, onEncerrarAtendimento }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Form pra adicionar nova terceirizada
  const [historicoAberto, setHistoricoAberto] = useState(false)
  // quem de fato resolveu: a passagem mais recente encerrada como 'Resolvido'
  // (a lista vem da API em ordem decrescente)
  const resolvedor = (ticket.atendimentos || []).find((a) => a.motivo === 0)
  const [novaEmpresa, setNovaEmpresa] = useState('')
  const [novoProtocolo, setNovoProtocolo] = useState('')

  const { user } = useAuth()
  const atender = useAtenderChamado()

  // Empresas reais + mutações de delegação (ChamadoTerceirizada)
  const { data: empresas = [] } = useEmpresas()
  const delegar = useDelegarChamado()
  const editarDelegacao = useEditarDelegacao()
  const removerDelegacao = useRemoverDelegacao()

  if (!ticket) return null

  const team = teams.find((t) => t.id === ticket.team)
  const terceirizadas = ticket.terceirizadas || []
  const encerrado = ['resolvido', 'cancelado'].includes(ticket.statusReal)

  // quem está atendendo este chamado agora
  const equipeNoChamado = ticket.equipe
  const tecnicosNoChamado = equipeNoChamado?.members || []
  const euAtendo = !!(
    user?.tecnico_id &&
    ticket.equipeTecnicoIds?.includes(user.tecnico_id)
  )
  const atendidoPorOutro = !!equipeNoChamado && !euAtendo
  const quemAtende = tecnicosNoChamado.map((m) => m.name.split(' ')[0]).join(' + ')

  // Empresas que ainda não estão vinculadas a este chamado
  const empresasLivres = empresas.filter(
    (e) => !terceirizadas.some((x) => x.empresa === e.nome)
  )
  const podeAdicionar = novaEmpresa && novoProtocolo.trim()

  const adicionarTerceirizada = () => {
    if (!podeAdicionar) return
    const empresa = empresas.find((e) => String(e.id) === String(novaEmpresa))
    if (!empresa) return

    delegar.mutate(
      {
        chamado: ticket.id,
        empresa_responsavel: empresa.id,
        protocolo: novoProtocolo.trim(),
        titulo: ticket.title,
        descricao: ticket.descricao || ticket.title,
      },
      {
        onSuccess: () => {
          setNovaEmpresa('')
          setNovoProtocolo('')
          // quem resolve agora é a empresa (a menos que já esteja encerrado)
          if (!['resolvido', 'cancelado'].includes(ticket.statusReal)) {
            onUpdate(ticket, { status: 'em_terceirizada' })
          }
        },
      }
    )
  }

  const removerTerceirizada = (delegacaoId) => {
    removerDelegacao.mutate(delegacaoId)
  }

  const atualizarProtocolo = (delegacaoId, protocolo) => {
    editarDelegacao.mutate({ id: delegacaoId, protocolo })
  }

  const ciclarStatusTerc = (delegacao) => {
    // Click na bolinha alterna Aberto <-> Finalizado.
    // Em andamento / Não resolvido são definidos na tela de Terceirizadas.
    const finalizando = delegacao.status !== TERC_STATUS.FINALIZADO
    editarDelegacao.mutate({
      id: delegacao.id,
      status_chamado: finalizando ? TERC_STATUS.FINALIZADO : TERC_STATUS.ABERTO,
      finalizado_em: finalizando ? new Date().toISOString() : null,
    })
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between gap-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-[12px] font-semibold" style={{ color: C.text3 }}>
                {ticket.code}
              </span>
              <PriorityCell p={ticket.priority} />
            </div>
            <h3 className="m-0 text-[16px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {ticket.title}
            </h3>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              Aberto {ticket.date.toLowerCase()} às {ticket.openedAt}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: C.text3 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Info do chamado. Status e prioridade não entram aqui: aparecem
              logo abaixo, já editáveis - repetir só ocuparia altura. */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
            <InfoItem label="Solicitante">
              <span style={{ color: C.text1 }}>
                {ticket.solicitante_nome || <span style={{ color: C.text3 }}>não informado</span>}
              </span>
            </InfoItem>

            <InfoItem label="Setor solicitante">
              <span style={{ color: C.text1 }}>{ticket.client}</span>
            </InfoItem>

            <InfoItem label="Equipe atribuída">
              {team ? (
                <span className="inline-flex items-center gap-2">
                  <Avatar initials={team.members[0].initials} color={team.members[0].color} size={22} />
                  <span style={{ color: C.text1 }}>{team.name}</span>
                  <span className="font-mono text-[11px]" style={{ color: C.text3 }}>· {team.id}</span>
                </span>
              ) : (
                <span style={{ color: C.text3 }}>Não atribuído</span>
              )}
            </InfoItem>

            <InfoItem label="Resolvido por" colSpan>
              <span className="inline-flex items-center gap-2 flex-wrap">
                <span style={{ color: resolvedor ? C.text1 : C.text3 }}>
                  {resolvedor ? resolvedor.tecnicos.join(', ') : 'ainda não resolvido'}
                </span>
                {(ticket.atendimentos || []).length > 0 && (
                  <button
                    onClick={() => setHistoricoAberto(true)}
                    className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                    style={{ backgroundColor: '#eef0ff', color: '#2d2783', border: '1px solid #d4d6ff' }}
                  >
                    ver equipes ({ticket.atendimentos.length})
                  </button>
                )}
              </span>
            </InfoItem>

            <InfoItem label="Endereço" colSpan>
              {/* compacto: o endereço completo já vem logo ao lado */}
              <span className="inline-flex items-center gap-2 flex-wrap">
                <LocalChamado chamado={ticket} compacto />
                <span style={{ color: C.text1 }}>{ticket.address}</span>
              </span>
            </InfoItem>
          </div>

          {/* Comentários deixados pelo técnico ao encerrar cada atendimento.
              Atendimento sem comentário não aparece: a lista é dos textos,
              não do histórico completo. */}
          {(ticket.atendimentos || []).some((a) => a.observacoes || a.instrucoes) && (
            <div className="mb-5">
              <div
                className="text-[10px] uppercase tracking-wider font-medium flex items-center gap-1.5 mb-2"
                style={{ color: C.text3 }}
              >
                <MessageSquare className="w-3 h-3" strokeWidth={1.75} />
                Comentários do atendimento
              </div>
              <ul className="list-none p-0 m-0 space-y-2">
                {ticket.atendimentos.filter((a) => a.observacoes || a.instrucoes).map((a) => (
                  <li
                    key={a.id}
                    className="px-3 py-2 rounded-md"
                    style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
                  >
                    {a.observacoes && (
                      <div className="text-[13px] whitespace-pre-wrap" style={{ color: C.text1 }}>
                        {a.observacoes}
                      </div>
                    )}
                    {a.instrucoes && (
                      <div
                        className="text-[13px] whitespace-pre-wrap mt-1.5 px-2.5 py-2 rounded"
                        style={{ backgroundColor: '#eef2ff', color: '#312e81', border: '1px solid #c7d2fe' }}
                      >
                        <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#6366f1' }}>
                          Guia pro solicitante
                        </div>
                        {a.instrucoes}
                      </div>
                    )}
                    <div className="text-[11px] mt-1 flex items-center gap-2 flex-wrap" style={{ color: C.text3 }}>
                      <span>{a.tecnicos.join(', ') || 'equipe'}</span>
                      {a.encerrado_em && (
                        <>
                          <span>·</span>
                          <span>{new Date(a.encerrado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                      {a.motivo_display && (
                        <>
                          <span>·</span>
                          <span>{a.motivo_display}</span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Terceirizadas vinculadas */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div
                className="text-[10px] uppercase tracking-wider font-medium flex items-center gap-1.5"
                style={{ color: C.text3 }}
              >
                <Briefcase className="w-3 h-3" strokeWidth={1.75} />
                Empresas terceirizadas
              </div>
              {terceirizadas.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}
                >
                  {terceirizadas.length} vinculada{terceirizadas.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Lista de terceirizadas vinculadas */}
            {terceirizadas.length > 0 && (
              <ul className="list-none p-0 m-0 space-y-1.5 mb-2">
                {terceirizadas.map((x) => {
                  const meta = TERCEIRIZADAS_META[x.empresa] || {}
                  const statusTerc = TERC_STATUS_META[x.status] || {}
                  const concluido = x.status === TERC_STATUS.FINALIZADO || x.status === TERC_STATUS.NAO_RESOLVIDO
                  return (
                    <li
                      key={x.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
                      style={{
                        backgroundColor: meta.bg || C.surface2,
                        border: `1px solid ${meta.dot ? `${meta.dot}55` : C.border}`,
                      }}
                    >
                      {/* Bolinha de status do ChamadoTerceirizada - click cicla pelos estados */}
                      <button
                        type="button"
                        onClick={() => ciclarStatusTerc(x)}
                        title={`${statusTerc.label} · click para ${x.status === TERC_STATUS.FINALIZADO ? 'reabrir' : 'finalizar'}`}
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: statusTerc.dot,
                          boxShadow: concluido
                            ? `0 0 0 2px #fff, 0 0 0 3px ${statusTerc.dot}`
                            : `0 0 0 2px #fff`,
                        }}
                        aria-label={`Status ${statusTerc.label}`}
                      />
                      <span
                        className="text-[12px] font-semibold tracking-tight"
                        style={{ color: meta.fg || C.text1, minWidth: 70 }}
                      >
                        {x.empresa}
                      </span>
                      <input
                        type="text"
                        defaultValue={x.protocolo}
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v && v !== x.protocolo) atualizarProtocolo(x.id, v)
                        }}
                        placeholder="Protocolo"
                        className="flex-1 px-2 py-1 text-[12px] font-mono rounded focus:outline-none"
                        style={{
                          backgroundColor: '#ffffff',
                          border: `1px solid ${C.border}`,
                          color: C.text1,
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                      />
                      <span
                        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight leading-none flex-shrink-0 whitespace-nowrap"
                        style={{
                          backgroundColor: statusTerc.bg,
                          color: statusTerc.fg,
                          minWidth: 80,
                        }}
                      >
                        {statusTerc.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerTerceirizada(x.id)}
                        className="w-7 h-7 rounded flex items-center justify-center transition-colors flex-shrink-0"
                        style={{ color: C.text3 }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#dc2626' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
                        aria-label={`Remover ${x.empresa}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Form pra adicionar nova */}
            {empresasLivres.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={novaEmpresa}
                  onChange={(e) => setNovaEmpresa(e.target.value)}
                  className="px-2.5 py-1.5 text-[12px] rounded-md focus:outline-none"
                  style={{
                    backgroundColor: C.surface2,
                    border: `1px solid ${C.border}`,
                    color: novaEmpresa ? C.text1 : C.text3,
                    minWidth: 130,
                  }}
                >
                  <option value="">Empresa…</option>
                  {empresasLivres.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={novoProtocolo}
                  onChange={(e) => setNovoProtocolo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarTerceirizada() } }}
                  placeholder="Protocolo"
                  className="flex-1 px-2.5 py-1.5 text-[12px] font-mono rounded-md focus:outline-none"
                  style={{
                    backgroundColor: C.surface2,
                    border: `1px solid ${C.border}`,
                    color: C.text1,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
                <button
                  type="button"
                  onClick={adicionarTerceirizada}
                  disabled={!podeAdicionar}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors"
                  style={{
                    backgroundColor: podeAdicionar ? C.accent : '#c7c5d9',
                    color: '#fff',
                    cursor: podeAdicionar ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => { if (podeAdicionar) e.currentTarget.style.backgroundColor = C.accentInk }}
                  onMouseLeave={(e) => { if (podeAdicionar) e.currentTarget.style.backgroundColor = C.accent }}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  Vincular
                </button>
              </div>
            ) : terceirizadas.length > 0 && (
              <div className="text-[11px] italic" style={{ color: C.text3 }}>
                Todas as empresas cadastradas já estão vinculadas a este chamado.
              </div>
            )}
          </div>
        </div>

        {/* Prioridade e status lado a lado: são as duas ações rápidas da DIT */}
        <div
          className="grid grid-cols-2 gap-4 px-5 py-4"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <div>
            <div
              className="text-[10px] uppercase tracking-wider font-medium mb-2"
              style={{ color: C.text3 }}
            >
              Mudar prioridade
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["urgente", "alta", "media", "baixa"].map((p) => {
                const ativo = ticket.priority === p
                return (
                  <button
                    key={p}
                    onClick={() => onUpdate(ticket, { priority: p })}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
                    style={
                      ativo
                        ? { backgroundColor: '#eef0ff', color: '#2d2783', border: '1px solid #c7d2fe' }
                        : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
                    }
                  >
                    {PRIORITY_META[p].label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status (só a DIT altera) */}
          <div>
            <div
              className="text-[10px] uppercase tracking-wider font-medium mb-2"
              style={{ color: C.text3 }}
            >
              Mudar status
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_EDITAVEIS.map((s) => {
                const meta = STATUS_META[s]
                const ativo = ticket.statusReal === s
                return (
                  <button
                    key={s}
                    onClick={() => onUpdate(ticket, { status: s })}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
                    style={
                      ativo
                        ? { backgroundColor: meta.bg, color: meta.fg, border: `1px solid ${meta.dot}` }
                        : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
                    }
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-end gap-2"
          style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}
        >
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[12px] transition-colors"
            style={{ color: C.text2 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
          >
            Fechar
          </button>
          {/* Um chamado é atendido por uma equipe de cada vez. O botão muda
              conforme quem está nele: eu, outra pessoa, ou ninguém. */}
          {user?.eh_tecnico && !encerrado && (
            euAtendo ? (
              <button
                onClick={onEncerrarAtendimento}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ backgroundColor: '#0284c7', color: '#fff' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
              >
                <StopCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                Encerrar meu atendimento
              </button>
            ) : atendidoPorOutro ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
                style={{ backgroundColor: C.surface2, color: C.text3, border: `1px solid ${C.border}`, cursor: 'not-allowed' }}
                title={`Em atendimento por ${quemAtende}`}
              >
                <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                Em atendimento
              </span>
            ) : (
              <button
                onClick={onAtender}
                disabled={atender.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ backgroundColor: '#0284c7', color: '#fff' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
              >
                <PlayCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                {atender.isPending ? 'Assumindo…' : 'Ir para o chamado'}
              </button>
            )
          )}
          <button
            onClick={() => onAssign(ticket)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: '#ffffff', color: C.text1, border: `1px solid ${C.border2}` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
            {team ? 'Reatribuir equipe' : 'Atribuir equipe'}
          </button>
          <button
            onClick={() => onUpdate(ticket, { status: 'resolvido' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            Marcar como resolvido
          </button>
        </div>
      </div>

      {historicoAberto && (
        <HistoricoEquipesModal chamado={ticket} onClose={() => setHistoricoAberto(false)} />
      )}
    </div>
  )
}

function InfoItem({ label, colSpan, children }) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: C.text3 }}>
        {label}
      </div>
      <div className="text-[13px]">
        {children}
      </div>
    </div>
  )
}
