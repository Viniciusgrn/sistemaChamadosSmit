import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Ticket, Loader2, AlertCircle, Clock, X, UserPlus, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useChamadosVisiveis, useAbrirChamado, useCancelarChamado } from '../../hooks/useChamados'
import { useUnidadesLista } from '../../hooks/useLocalidades'
import {
  useSolicitacoesDivisao, useAprovarSolicitacao, useRecusarSolicitacao,
} from '../../hooks/useSolicitacoes'

const C = {
  bg:       '#f7f7f4',
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

const STATUS_META = {
  0: { label: 'Aberto',        cor: '#ea580c', bg: '#fff1e6' },
  1: { label: 'Em andamento',  cor: '#2563eb', bg: '#e5edff' },
  2: { label: 'Finalizado',    cor: '#16a34a', bg: '#dcfce7' },
  3: { label: 'Cancelado',     cor: '#6b7280', bg: '#f1f1ef' },
  4: { label: 'Em manutenção', cor: '#7c3aed', bg: '#f3e8ff' },
  5: { label: 'Agendado',      cor: '#6366f1', bg: '#eef2ff' },
  6: { label: 'Encaminhado p/ terceirizada', cor: '#475569', bg: '#f1f5f9' },
}

// Concluídos junta Finalizado + Cancelado (o que saiu da fila)
// Enquanto não é finalizado nem cancelado, o chamado continua "em aberto" -
// não importa se está agendado, em manutenção ou com terceirizada. Quem quer
// ver a etapa exata olha o selo de status na linha.
const ABERTO = 'abertos'
const FINALIZADO = 'finalizados'

const ABAS = [
  { status: ABERTO,     label: 'Em aberto',   vazio: 'Nenhum chamado em aberto.' },
  { status: FINALIZADO, label: 'Finalizados', vazio: 'Nenhum chamado finalizado.' },
]

// status_chamado 2 (Finalizado) e 3 (Cancelado) saíram da fila
const ENCERRADOS = [2, 3]

const TIPO_OPCOES = [
  { value: 0, label: 'Helpdesk' },
  { value: 1, label: 'Manutenção' },
  { value: 2, label: 'Requisição' },
  { value: 3, label: 'Suporte' },
]

export default function ChamadosSolicitante() {
  const { user } = useAuth()
  const { data: chamados = [], isLoading, isError } = useChamadosVisiveis()
  const [abrindo, setAbrindo] = useState(false)
  // id do chamado aberto no modal de consulta (null = fechado)
  const [detalheId, setDetalheId] = useState(null)
  const chamadoDetalhe = useMemo(
    () => chamados.find((c) => c.id === detalheId) || null,
    [chamados, detalheId]
  )
  const [aba, setAba] = useState(ABERTO) // ABERTO | FINALIZADO | 'solicitacoes'
  const [soMeus, setSoMeus] = useState(false)

  // sem setor e sem privilégio → não abre chamado, precisa pedir vínculo
  const semSetor = !user?.divisao && !user?.pode_escolher_unidade

  // aba de solicitações: chefes decidem pedidos de entrada no setor
  const { data: solicitacoes = [] } = useSolicitacoesDivisao(
    undefined, // sem filtro; escopo vem do backend
  )
  const solicitacoesPendentes = useMemo(
    () => solicitacoes.filter((s) => s.status === 0 && s.usuario?.id !== user?.id),
    [solicitacoes, user]
  )
  const mostraAbaSolicitacoes = !!user?.eh_chefe

  const porStatus = useMemo(() => {
    const m = { [ABERTO]: [], [FINALIZADO]: [] }
    for (const c of chamados) {
      if (soMeus && c.solicitante !== user?.id) continue
      m[ENCERRADOS.includes(c.status_chamado) ? FINALIZADO : ABERTO].push(c)
    }
    return m
  }, [chamados, soMeus, user])

  const daAba = porStatus[aba] || []

  // chefes/secretários enxergam mais de uma divisão → agrupa por divisão
  const grupos = useMemo(() => {
    const porDivisao = new Map()
    for (const c of daAba) {
      const chave = c.divisao_nome ? `${c.secretaria_sigla} · ${c.divisao_nome}` : 'Sem divisão'
      if (!porDivisao.has(chave)) porDivisao.set(chave, [])
      porDivisao.get(chave).push(c)
    }
    return [...porDivisao.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [daAba])

  const multiDivisao = grupos.length > 1

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      <header
        className="flex-shrink-0 px-6 pt-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
              Chamados
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              Olá, {user?.nome_completo?.split(' ')[0]}
              {user?.divisao && ` · ${user.divisao.secretaria} - ${user.divisao.nome}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoMeus((v) => !v)}
              className="px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={
                soMeus
                  ? { backgroundColor: '#eef0ff', color: C.accentInk, border: '1px solid #d4d6ff' }
                  : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
              }
            >
              Só os meus
            </button>
            <button
              onClick={() => setAbrindo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ backgroundColor: C.accent, color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Abrir chamado
            </button>
          </div>
        </div>

        {/* Abas por status (+ solicitações, pros chefes) */}
        <div className="flex items-center gap-1">
          {ABAS.map((a) => {
            const ativo = aba === a.status
            const qtd = (porStatus[a.status] || []).length
            return (
              <button
                key={a.status}
                onClick={() => setAba(a.status)}
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors"
                style={{
                  color: ativo ? C.accentInk : C.text2,
                  borderBottom: `2px solid ${ativo ? C.accent : 'transparent'}`,
                  marginBottom: '-1px',
                }}
              >
                {a.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: ativo ? '#eef0ff' : C.surface2,
                    color: ativo ? C.accentInk : C.text3,
                  }}
                >
                  {qtd}
                </span>
              </button>
            )
          })}

          {mostraAbaSolicitacoes && (
            <button
              onClick={() => setAba('solicitacoes')}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors"
              style={{
                color: aba === 'solicitacoes' ? C.accentInk : C.text2,
                borderBottom: `2px solid ${aba === 'solicitacoes' ? C.accent : 'transparent'}`,
                marginBottom: '-1px',
              }}
            >
              <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
              Solicitações
              {solicitacoesPendentes.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                >
                  {solicitacoesPendentes.length}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {aba === 'solicitacoes' ? (
            <SolicitacoesChefe pendentes={solicitacoesPendentes} />
          ) : isLoading ? (
            <Estado icon={Loader2} spin texto="Carregando chamados…" />
          ) : isError ? (
            <Estado icon={AlertCircle} texto="Erro ao carregar chamados." />
          ) : daAba.length === 0 ? (
            <div
              className="text-center py-16 rounded-lg"
              style={{ backgroundColor: C.surface, border: `1px dashed ${C.border2}`, color: C.text3 }}
            >
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <div className="text-[13px]">
                {ABAS.find((a) => a.status === aba)?.vazio}
              </div>
            </div>
          ) : multiDivisao ? (
            grupos.map(([divisao, lista]) => (
              <div key={divisao} className="mb-6">
                <div
                  className="text-[11px] uppercase tracking-wider font-medium mb-2 px-1"
                  style={{ color: C.text3 }}
                >
                  {divisao} · {lista.length}
                </div>
                <ul className="list-none p-0 m-0 space-y-3">
                  {lista.map((c) => <ChamadoCard key={c.id} chamado={c} meu={c.solicitante === user?.id} onAbrir={() => setDetalheId(c.id)} />)}
                </ul>
              </div>
            ))
          ) : (
            <ul className="list-none p-0 m-0 space-y-3">
              {daAba.map((c) => <ChamadoCard key={c.id} chamado={c} meu={c.solicitante === user?.id} onAbrir={() => setDetalheId(c.id)} />)}
            </ul>
          )}
        </div>
      </div>

      {abrindo && (
        semSetor
          ? <SemSetorModal onClose={() => setAbrindo(false)} />
          : <AbrirChamadoModal user={user} onClose={() => setAbrindo(false)} />
      )}

      {chamadoDetalhe && (
        <DetalheChamadoModal
          chamado={chamadoDetalhe}
          meu={chamadoDetalhe.solicitante === user?.id}
          onClose={() => setDetalheId(null)}
        />
      )}
    </div>
  )
}

// Bloqueio: usuário sem setor não abre chamado - manda pro perfil pedir vínculo.
function SemSetorModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg p-6 text-center"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)' }}
      >
        <UserPlus className="w-8 h-8 mx-auto mb-3" strokeWidth={1.5} style={{ color: C.accent }} />
        <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
          Você ainda não tem setor
        </h3>
        <p className="text-[12px] mt-2 mb-4" style={{ color: C.text2 }}>
          Pra abrir chamados você precisa estar vinculado a uma divisão.
          Solicite a entrada no seu setor pelo seu perfil - o seu chefe (ou a DIT) aprova e pronto.
        </p>
        <Link
          to="/perfil"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium no-underline"
          style={{ backgroundColor: C.accent, color: '#fff' }}
        >
          Solicitar meu setor →
        </Link>
      </div>
    </div>
  )
}

// Aba do chefe: pedidos de entrada no(s) setor(es) dele, com aceitar/recusar.
function SolicitacoesChefe({ pendentes }) {
  const aprovar = useAprovarSolicitacao()
  const recusar = useRecusarSolicitacao()

  if (pendentes.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-lg"
        style={{ backgroundColor: C.surface, border: `1px dashed ${C.border2}`, color: C.text3 }}
      >
        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
        <div className="text-[13px]">Nenhuma solicitação pendente pro seu setor.</div>
      </div>
    )
  }

  return (
    <ul className="list-none p-0 m-0 space-y-3">
      {pendentes.map((s) => (
        <li
          key={s.id}
          className="rounded-lg px-5 py-4 flex items-center justify-between gap-4"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}` }}
        >
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {s.usuario.nome_completo}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              <span className="font-mono">{s.usuario.username}</span>
              {' '}quer entrar em <span className="font-medium">{s.divisao.secretaria} · {s.divisao.nome}</span>
            </div>
            <div className="text-[11px] mt-1" style={{ color: C.text3 }}>
              Pedido em {new Date(s.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => recusar.mutate(s.id)}
              disabled={recusar.isPending || aprovar.isPending}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ color: '#b91c1c', border: '1px solid #fecaca', backgroundColor: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
            >
              Recusar
            </button>
            <button
              onClick={() => aprovar.mutate(s.id)}
              disabled={aprovar.isPending || recusar.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ backgroundColor: '#16a34a', color: '#fff' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              Aceitar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function ChamadoCard({ chamado: c, meu, onAbrir }) {
  const st = STATUS_META[c.status_chamado] || STATUS_META[0]
  const recomendacoes = (c.atendimentos || []).filter((a) => a.instrucoes)
  const [verRecomendacoes, setVerRecomendacoes] = useState(false)
  return (
    <li
      onClick={onAbrir}
      className="rounded-lg px-5 py-4 cursor-pointer transition-shadow"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}` }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px -6px rgba(20,22,36,0.18)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
      title="Ver detalhes do chamado"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold" style={{ color: C.text3 }}>
              #{c.id}
            </span>
            <span className="text-[14px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
              {c.titulo}
            </span>
            {meu && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                style={{ backgroundColor: '#eef0ff', color: '#2d2783' }}
              >
                meu
              </span>
            )}
          </div>
          <div className="text-[12px] mt-1 line-clamp-2" style={{ color: C.text2 }}>
            {c.descricao}
          </div>

          {/* Recomendações da TI ficam atrás de um botão: inline elas
              esticariam o cartão sem limite quando há várias. stopPropagation:
              abrir as recomendações não é abrir o detalhe do chamado. */}
          {recomendacoes.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setVerRecomendacoes(true) }}
              className="mt-2 px-2.5 py-1 rounded-md text-[11px] font-medium"
              style={{ backgroundColor: '#eef2ff', color: '#312e81', border: '1px solid #c7d2fe' }}
            >
              Ver recomendaç{recomendacoes.length === 1 ? 'ão' : 'ões'} da TI
              {recomendacoes.length > 1 ? ` (${recomendacoes.length})` : ''}
            </button>
          )}

          {verRecomendacoes && (
            <RecomendacoesModal
              chamado={c}
              recomendacoes={recomendacoes}
              onClose={() => setVerRecomendacoes(false)}
            />
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap" style={{ color: C.text3 }}>
            <span>{c.tipo_display}</span>
            <span>·</span>
            <span>{c.solicitante_nome}</span>
            <span>·</span>
            <span>{c.unidade_nome}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={1.75} />
              {new Date(c.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: st.bg, color: st.cor }}
          >
            {st.label}
          </span>

          {/* só o dono cancela, e só enquanto ninguém assumiu (Aberto).
              stopPropagation: cancelar não é "abrir os detalhes" */}
          {meu && c.status_chamado === 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <BotaoCancelar id={c.id} />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

// Cancelamento com confirmação inline (evita cancelar sem querer)
function BotaoCancelar({ id }) {
  const [confirmando, setConfirmando] = useState(false)
  const cancelar = useCancelarChamado()

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="text-[11px] px-2 py-1 rounded transition-colors"
        style={{ color: C.text3 }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#b91c1c' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
      >
        Cancelar chamado
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px]" style={{ color: C.text2 }}>Confirmar?</span>
      <button
        onClick={() => cancelar.mutate(id)}
        disabled={cancelar.isPending}
        className="text-[11px] px-2 py-1 rounded font-medium"
        style={{ backgroundColor: '#dc2626', color: '#fff' }}
      >
        {cancelar.isPending ? 'Cancelando…' : 'Sim'}
      </button>
      <button
        onClick={() => setConfirmando(false)}
        className="text-[11px] px-2 py-1 rounded"
        style={{ color: C.text2 }}
      >
        Não
      </button>
    </div>
  )
}

function AbrirChamadoModal({ user, onClose }) {
  const abrir = useAbrirChamado()
  const podeEscolher = !!user?.pode_escolher_unidade

  // servidor comum: só as unidades do próprio setor (se houver mais de uma);
  // chefe/secretário: todas
  const filtros = podeEscolher ? {} : (user?.divisao ? { divisao: user.divisao.id } : {})
  const { data: unidades = [] } = useUnidadesLista(filtros)
  const unidadesOrdenadas = useMemo(
    () => [...unidades].sort((a, b) => a.nome.localeCompare(b.nome)),
    [unidades]
  )

  // se o setor tem 1 unidade só, nem mostra o campo
  const unidadeUnica = !podeEscolher && unidadesOrdenadas.length === 1 ? unidadesOrdenadas[0] : null

  const [form, setForm] = useState({ titulo: '', descricao: '', tipo_chamado: 0, unidade_id: '' })
  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const precisaEscolherUnidade = !unidadeUnica && unidadesOrdenadas.length > 0
  const pode =
    form.titulo.trim() && form.descricao.trim() && !abrir.isPending &&
    (!precisaEscolherUnidade || form.unidade_id)

  const submit = (e) => {
    e.preventDefault()
    if (!pode) return
    const body = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      tipo_chamado: Number(form.tipo_chamado),
    }
    const unidadeId = unidadeUnica?.id || (form.unidade_id ? Number(form.unidade_id) : null)
    if (unidadeId) body.unidade_id = unidadeId
    abrir.mutate(body, { onSuccess: onClose })
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Abrir chamado
            </h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center" style={{ color: C.text3 }} aria-label="Fechar">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Campo label="Título" required>
            <input
              value={form.titulo}
              onChange={(e) => update('titulo', e.target.value)}
              placeholder="Resumo do problema (ex: computador não liga)"
              autoFocus
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </Campo>

          <Campo label="Descrição" required>
            <textarea
              value={form.descricao}
              onChange={(e) => update('descricao', e.target.value)}
              placeholder="Descreva o que está acontecendo, desde quando, e onde o equipamento fica…"
              rows={4}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-y"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </Campo>

          <Campo label="Tipo">
            <select
              value={form.tipo_chamado}
              onChange={(e) => update('tipo_chamado', e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            >
              {TIPO_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Campo>

          {unidadeUnica ? (
            <div
              className="text-[12px] px-3 py-2 rounded-md"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text2 }}
            >
              Chamado será aberto para: <span className="font-medium" style={{ color: C.text1 }}>{unidadeUnica.nome}</span>
            </div>
          ) : precisaEscolherUnidade ? (
            <Campo label={podeEscolher ? 'Unidade' : 'Unidade do seu setor'} required>
              <select
                value={form.unidade_id}
                onChange={(e) => update('unidade_id', e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              >
                <option value="">Selecione…</option>
                {unidadesOrdenadas.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </Campo>
          ) : null}

          {abrir.isError && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {abrir.error?.data?.descricao?.[0] || abrir.error?.data?.unidade_id?.[0] ||
                abrir.error?.data?.detail ||
                `Erro ao abrir o chamado${abrir.error?.status ? ` (${abrir.error.status})` : ''}.`}
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!pode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
            style={{ backgroundColor: pode ? C.accent : '#c7c5d9', color: '#fff', cursor: pode ? 'pointer' : 'not-allowed' }}
          >
            {abrir.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
            {abrir.isPending ? 'Abrindo…' : 'Abrir chamado'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Campo({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}


// Só as recomendações da TI, nada mais: é o que o solicitante procura quando
// clica em "ver recomendação" na lista.
function RecomendacoesModal({ chamado: c, recomendacoes, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const dataHora = (iso) => iso
    ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClose() }}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg overflow-hidden flex flex-col max-h-[80vh]"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Recomendações da TI
            </h3>
            <div className="text-[11px] mt-0.5 truncate" style={{ color: C.text3 }}>
              #{c.id} · {c.titulo}
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ color: C.text3 }} aria-label="Fechar">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {recomendacoes.map((a) => (
            <div
              key={a.id}
              className="text-[13px] px-3 py-2 rounded-md whitespace-pre-wrap"
              style={{ backgroundColor: '#eef2ff', color: '#312e81', border: '1px solid #c7d2fe' }}
            >
              {a.instrucoes}
              {a.encerrado_em && (
                <div className="text-[11px] mt-1" style={{ color: '#6366f1' }}>
                  {dataHora(a.encerrado_em)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Consulta do chamado pro SOLICITANTE: só o que é dele — descrição, situação,
// datas, instruções deixadas pela TI e quem resolveu. Relatório interno da TI
// nunca chega aqui (o backend envia o campo vazio pra quem não opera o sistema).
function DetalheChamadoModal({ chamado: c, meu, onClose }) {
  const cancelar = useCancelarChamado()
  const [erroCancelar, setErroCancelar] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // cancelar não pode ser um clique só; a confirmação é uma caixa própria
  // (window.confirm destoa do resto da interface)
  const [confirmando, setConfirmando] = useState(false)

  const executarCancelamento = () => {
    setErroCancelar('')
    cancelar.mutate(c.id, {
      onSuccess: () => setConfirmando(false),
      onError: () => {
        setConfirmando(false)
        setErroCancelar('Não foi possível cancelar o chamado.')
      },
    })
  }

  const st = STATUS_META[c.status_chamado] || STATUS_META[0]
  const instrucoes = (c.atendimentos || []).filter((a) => a.instrucoes)
  const resolvedor = (c.atendimentos || []).find((a) => a.motivo === 0)

  const dataHora = (iso) => iso
    ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)' }}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-semibold" style={{ color: C.text3 }}>#{c.id}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: st.bg, color: st.cor }}>
                {st.label}
              </span>
            </div>
            <h3 className="m-0 mt-1 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {c.titulo}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ color: C.text3 }} aria-label="Fechar">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {c.descricao && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: C.text3 }}>
                Descrição
              </div>
              <p className="text-[13px] leading-relaxed m-0 whitespace-pre-wrap" style={{ color: C.text2 }}>
                {c.descricao}
              </p>
            </div>
          )}

          {/* O que a TI deixou PARA o solicitante — a parte mais útil da consulta */}
          {instrucoes.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: '#6366f1' }}>
                Instruções da TI
              </div>
              <div className="space-y-2">
                {instrucoes.map((a) => (
                  <div
                    key={a.id}
                    className="text-[13px] px-3 py-2 rounded-md whitespace-pre-wrap"
                    style={{ backgroundColor: '#eef2ff', color: '#312e81', border: '1px solid #c7d2fe' }}
                  >
                    {a.instrucoes}
                    {a.encerrado_em && (
                      <div className="text-[11px] mt-1" style={{ color: '#6366f1' }}>
                        {dataHora(a.encerrado_em)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Info label="Tipo">{c.tipo_display}</Info>
            <Info label="Solicitante">{c.solicitante_nome || c.nome_solicitante || '—'}</Info>
            <Info label="Setor">
              {c.divisao_nome ? `${c.secretaria_sigla} · ${c.divisao_nome}` : (c.unidade_nome || '—')}
            </Info>
            <Info label="Unidade">{c.unidade_nome || '—'}</Info>
            <Info label="Aberto em">{dataHora(c.created_at) || '—'}</Info>
            {c.finalizado_em && <Info label="Encerrado em">{dataHora(c.finalizado_em)}</Info>}
            {resolvedor && resolvedor.tecnicos?.length > 0 && (
              <Info label="Resolvido por" colSpan>
                {resolvedor.tecnicos.join(', ')}
              </Info>
            )}
          </div>
        </div>

        {confirmando && (
          <div
            className="fixed inset-0 z-[1400] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(20,22,36,0.45)' }}
            onClick={() => setConfirmando(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-lg p-5 text-center"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 20px 48px -8px rgba(20,22,36,0.3)' }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#fee2e2' }}
              >
                <AlertCircle className="w-5 h-5" strokeWidth={1.75} style={{ color: '#dc2626' }} />
              </div>
              <div className="text-[14px] font-semibold tracking-tight" style={{ color: C.text1 }}>
                Cancelar o chamado #{c.id}?
              </div>
              <div className="text-[12px] mt-1 mb-4 truncate" style={{ color: C.text2 }}>
                {c.titulo}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="px-4 py-2 rounded-md text-[13px] font-medium"
                  style={{ backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={executarCancelamento}
                  disabled={cancelar.isPending}
                  className="px-4 py-2 rounded-md text-[13px] font-medium"
                  style={{ backgroundColor: '#dc2626', color: '#fff', opacity: cancelar.isPending ? 0.6 : 1 }}
                >
                  {cancelar.isPending ? 'Cancelando…' : 'Sim, cancelar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* dono cancela por aqui também, enquanto ninguém assumiu */}
        {meu && c.status_chamado === 0 && (
          <div
            className="px-5 py-3 flex items-center justify-between gap-3"
            style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}
          >
            <span className="text-[12px]" style={{ color: '#b91c1c' }}>
              {erroCancelar}
            </span>
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              disabled={cancelar.isPending}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                opacity: cancelar.isPending ? 0.6 : 1,
                cursor: cancelar.isPending ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!cancelar.isPending) e.currentTarget.style.backgroundColor = '#b91c1c' }}
              onMouseLeave={(e) => { if (!cancelar.isPending) e.currentTarget.style.backgroundColor = '#dc2626' }}
            >
              {cancelar.isPending ? 'Cancelando…' : 'Cancelar chamado'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Info({ label, colSpan, children }) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wider font-medium mb-0.5" style={{ color: C.text3 }}>
        {label}
      </div>
      <div className="text-[13px]" style={{ color: C.text1 }}>{children}</div>
    </div>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px]">{texto}</span>
    </div>
  )
}
