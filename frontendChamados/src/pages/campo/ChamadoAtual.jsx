import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Phone, Clock, Users, Car, Navigation, AlertCircle, Loader2,
  StopCircle, Building2,
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { useChamadosDIT, useEncerrarAtendimento } from '../../hooks/useChamados'
import { useEquipesAtivas } from '../../hooks/useEquipes'
import { PRIORITY_META, STATUS_META } from '../chamados/data'
import { INT_POR_STATUS } from '../chamados/adapters'
import EncerrarAtendimentoModal from '../../components/chamados/EncerrarAtendimentoModal'
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

/**
 * O chamado que a EQUIPE está atendendo agora.
 *
 * Não é "o chamado que eu abri": a fonte é a equipe em que a pessoa está, e o
 * `chamado_atual` dela. Por isso todo mundo da equipe — inclusive o aprendiz,
 * que não assume nada — vê exatamente a mesma coisa aqui.
 */
export default function ChamadoAtual() {
  const { user } = useAuth()
  const { data: equipes = [], isLoading: carregandoEquipes } = useEquipesAtivas()
  const { data: chamados = [], isLoading: carregandoChamados } = useChamadosDIT()
  const encerrar = useEncerrarAtendimento()
  const [encerrando, setEncerrando] = useState(false)
  const [erro, setErro] = useState('')

  const minhaEquipe = useMemo(
    () => equipes.find((e) => e.tecnicoIds?.includes(user?.tecnico_id)),
    [equipes, user]
  )

  const chamado = useMemo(() => {
    const code = minhaEquipe?.activeTicket?.code
    return code ? chamados.find((c) => c.code === code) : null
  }, [minhaEquipe, chamados])

  if (carregandoEquipes || carregandoChamados) {
    return <Estado icon={Loader2} spin texto="Carregando…" />
  }

  if (!minhaEquipe) {
    return (
      <Estado
        icon={Users}
        texto="Você não está em nenhuma equipe agora."
        acao={{ to: '/equipes', label: 'Entrar numa equipe' }}
      />
    )
  }

  if (!chamado) {
    return (
      <Estado
        icon={Navigation}
        texto={`Equipe ${minhaEquipe.name} montada, sem chamado em atendimento.`}
        acao={{ to: '/chamados', label: 'Ver chamados' }}
      />
    )
  }

  const prio = PRIORITY_META[chamado.priority] || {}
  const st = STATUS_META[chamado.status] || {}
  const podeEncerrar = user?.pode_atender

  return (
    <div className="p-4 flex flex-col gap-3 pb-6">
      {/* Cabeçalho do chamado */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-[12px] font-semibold" style={{ color: C.text3 }}>
              #{chamado.code}
            </div>
            <h1 className="text-[17px] font-semibold leading-snug mt-0.5" style={{ color: C.text1 }}>
              {chamado.title}
            </h1>
          </div>
          <span
            className="px-2 py-1 rounded text-[10px] font-semibold flex-shrink-0 whitespace-nowrap"
            style={{ backgroundColor: prio.bg, color: prio.fg }}
          >
            {prio.label}
          </span>
        </div>

        <span
          className="self-start inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium"
          style={{ backgroundColor: st.bg, color: st.fg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
          {st.label}
        </span>

        {chamado.descricao && (
          <p className="text-[13px] leading-relaxed m-0" style={{ color: C.text2 }}>
            {chamado.descricao}
          </p>
        )}
      </div>

      {/* Onde ir — o dado mais usado em campo, com atalho pro mapa do celular */}
      <Bloco titulo="Local">
        <Linha icon={Building2} texto={chamado.client} />
        <Linha
          icon={chamado.interno ? Building2 : MapPin}
          texto={chamado.address || 'Endereço não informado'}
        />
        {chamado.interno ? (
          // atendimento no próprio Paço: não há deslocamento, rota só confunde
          <div
            className="mt-1 flex items-center justify-center gap-2 w-full min-h-[40px] rounded-lg text-[12px] font-medium"
            style={{ backgroundColor: '#ccfbf1', color: '#0f766e' }}
          >
            <Building2 className="w-4 h-4" strokeWidth={1.75} />
            Atendimento interno
          </div>
        ) : chamado.latitude != null && chamado.longitude != null ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${chamado.latitude},${chamado.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center justify-center gap-2 w-full min-h-[48px] rounded-lg text-[13px] font-medium"
            style={{ backgroundColor: C.accent, color: '#fff' }}
          >
            <Navigation className="w-4 h-4" strokeWidth={2} />
            Traçar rota
          </a>
        ) : null}
      </Bloco>

      <Bloco titulo="Solicitante">
        <Linha icon={Users} texto={chamado.solicitante_nome || '—'} />
        {chamado.telefone && (
          <a
            href={`tel:${chamado.telefone}`}
            className="flex items-center gap-2 min-h-[44px] text-[13px]"
            style={{ color: C.accent }}
          >
            <Phone className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
            {chamado.telefone}
          </a>
        )}
      </Bloco>

      {/* O que as equipes anteriores anotaram ao encerrar. Pro técnico em
          campo isso é contexto direto: o que já foi tentado e como terminou. */}
      {(chamado.atendimentos || []).some((a) => a.observacoes) && (
        <Bloco titulo="Comentários de atendimentos anteriores">
          <ul className="list-none p-0 m-0 space-y-2">
            {chamado.atendimentos.filter((a) => a.observacoes).map((a) => (
              <li key={a.id}>
                <div className="text-[13px] whitespace-pre-wrap" style={{ color: C.text1 }}>
                  {a.observacoes}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
                  {a.tecnicos.join(', ') || 'equipe'}
                  {a.encerrado_em && ` · ${new Date(a.encerrado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}
                  {a.motivo_display && ` · ${a.motivo_display}`}
                </div>
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      <Bloco titulo={`Equipe · ${minhaEquipe.name}`}>
        <div className="flex flex-wrap gap-2">
          {(minhaEquipe.members || []).map((m) => (
            <span
              key={m.initials + m.name}
              className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-[12px]"
              style={{ backgroundColor: '#f3f2ee', color: C.text1 }}
            >
              <span
                className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </span>
              {m.name.split(' ')[0]}
            </span>
          ))}
        </div>
        {minhaEquipe.vehicle && (
          <Linha
            icon={Car}
            texto={`${minhaEquipe.vehicle.plate} · ${minhaEquipe.vehicle.model}`}
          />
        )}
        {minhaEquipe.tempoAtendimento && (
          <Linha icon={Clock} texto={`Em atendimento há ${minhaEquipe.tempoAtendimento}`} />
        )}
      </Bloco>

      {podeEncerrar ? (
        <button
          onClick={() => setEncerrando(true)}
          className="mt-1 inline-flex items-center justify-center gap-2 w-full min-h-[52px] rounded-lg text-[14px] font-semibold"
          style={{ backgroundColor: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
        >
          <StopCircle className="w-4.5 h-4.5" strokeWidth={1.75} />
          Encerrar meu atendimento
        </button>
      ) : (
        <div
          className="mt-1 flex items-start gap-2 p-3 rounded-lg text-[12px]"
          style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          Você acompanha este atendimento pela equipe. Quem encerra é o técnico responsável.
        </div>
      )}

      {encerrando && (
        <EncerrarAtendimentoModal
          chamadoAtual={chamado}
          onClose={() => setEncerrando(false)}
          onConfirmar={({ status, observacoes }) => {
            setErro('')
            encerrar.mutate(
              // o modal devolve a chave visual ('resolvido'); a API espera o
              // inteiro do status. Sem converter, volta 400 "Status inválido".
              { id: chamado.id, status: INT_POR_STATUS[status], observacoes },
              {
                onSuccess: () => setEncerrando(false),
                // sem isto o erro era silencioso: o modal só parava de carregar
                onError: (e) => setErro(mensagemErro(e, 'Não foi possível encerrar o atendimento.')),
              }
            )
          }}
          erro={erro}
          salvando={encerrar.isPending}
        />
      )}
    </div>
  )
}

function Bloco({ titulo, children }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: C.text3 }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function Linha({ icon: Icon, texto }) {
  return (
    <div className="flex items-start gap-2 text-[13px]" style={{ color: C.text2 }}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} style={{ color: C.text3 }} />
      <span className="min-w-0 break-words">{texto}</span>
    </div>
  )
}

function Estado({ icon: Icon, texto, spin, acao }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <Icon className={`w-8 h-8 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.5} style={{ color: C.text3 }} />
      <div className="text-[13px] max-w-xs" style={{ color: C.text2 }}>{texto}</div>
      {acao && (
        <Link
          to={acao.to}
          className="mt-1 inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg text-[13px] font-medium"
          style={{ backgroundColor: C.accent, color: '#fff' }}
        >
          {acao.label}
        </Link>
      )}
    </div>
  )
}
