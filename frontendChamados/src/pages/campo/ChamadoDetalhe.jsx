import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Building2, Users, Clock, Loader2, AlertCircle,
} from 'lucide-react'

import { useChamadosDIT } from '../../hooks/useChamados'
import { PRIORITY_META, STATUS_META } from '../chamados/data'
import { LocalChamado } from '../../components/chamados/shared'
import HistoricoEquipesModal from '../../components/chamados/HistoricoEquipesModal'

// Consulta de um chamado JÁ FEITO, na versão de campo. Mesmo desenho da tela
// "Atual", menos as ações: aqui o técnico só lê — o que era, onde foi, quem
// pediu e o que as equipes anotaram. Não há botão de encerrar nem de assumir.

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

function dataHora(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ChamadoDetalhe() {
  const { id } = useParams()
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const { data: chamados = [], isLoading } = useChamadosDIT()

  const chamado = useMemo(
    () => chamados.find((c) => String(c.id) === String(id)),
    [chamados, id]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
        <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.75} />
        <span className="text-[13px]">Carregando chamado…</span>
      </div>
    )
  }

  if (!chamado) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center" style={{ color: C.text3 }}>
        <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
        <span className="text-[13px]">Chamado não encontrado.</span>
        <Link to="/chamados" className="text-[13px]" style={{ color: C.accent }}>
          ← Voltar pros chamados
        </Link>
      </div>
    )
  }

  const prio = PRIORITY_META[chamado.priority] || {}
  const st = STATUS_META[chamado.status] || {}
  const comentarios = (chamado.atendimentos || []).filter((a) => a.observacoes)
  // a passagem mais recente encerrada como 'Resolvido' (lista vem em ordem desc)
  const resolvedor = (chamado.atendimentos || []).find((a) => a.motivo === 0)

  return (
    <div className="p-4 flex flex-col gap-3 pb-6">
      <Link
        to="/chamados"
        className="inline-flex items-center gap-1.5 text-[13px] min-h-[44px] no-underline"
        style={{ color: C.accent }}
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Voltar pros chamados
      </Link>

      {/* Cabeçalho — mesmo desenho do "chamado atual" */}
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

      <Bloco titulo="Local">
        <Linha icon={Building2} texto={chamado.client} />
        <Linha
          icon={chamado.interno ? Building2 : MapPin}
          texto={chamado.address || 'Endereço não informado'}
        />
        <LocalChamado chamado={chamado} compacto />
      </Bloco>

      <Bloco titulo="Solicitante">
        <Linha icon={Users} texto={chamado.solicitante_nome || '—'} />
      </Bloco>

      <Bloco titulo="Resolvido por">
        <Linha
          icon={Users}
          texto={resolvedor ? resolvedor.tecnicos.join(', ') : 'ainda não resolvido'}
        />
        {(chamado.atendimentos || []).length > 0 && (
          <button
            onClick={() => setHistoricoAberto(true)}
            className="self-start min-h-[40px] px-3 rounded-lg text-[13px] font-medium"
            style={{ backgroundColor: '#eef0ff', color: '#2d2783', border: '1px solid #d4d6ff' }}
          >
            Ver todas as equipes ({chamado.atendimentos.length})
          </button>
        )}
      </Bloco>

      <Bloco titulo="Datas">
        <Linha icon={Clock} texto={`Aberto em ${dataHora(chamado.created_at) || '—'}`} />
        {chamado.finalizado_em && (
          <Linha icon={Clock} texto={`Encerrado em ${dataHora(chamado.finalizado_em)}`} />
        )}
      </Bloco>

      {comentarios.length > 0 && (
        <Bloco titulo="Comentários dos atendimentos">
          <ul className="list-none p-0 m-0 space-y-2">
            {comentarios.map((a) => (
              <li key={a.id}>
                <div className="text-[13px] whitespace-pre-wrap" style={{ color: C.text1 }}>
                  {a.observacoes}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
                  {a.tecnicos.join(', ') || 'equipe'}
                  {a.encerrado_em && ` · ${dataHora(a.encerrado_em)}`}
                  {a.motivo_display && ` · ${a.motivo_display}`}
                </div>
              </li>
            ))}
          </ul>
        </Bloco>
      )}
      {historicoAberto && (
        <HistoricoEquipesModal chamado={chamado} onClose={() => setHistoricoAberto(false)} />
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
