import { useMemo, useState } from 'react'
import { UserPlus, Loader2, AlertCircle, Check, Search } from 'lucide-react'

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
  0: { label: 'Pendente', cor: '#ea580c', bg: '#fff1e6' },
  1: { label: 'Aprovada', cor: '#16a34a', bg: '#dcfce7' },
  2: { label: 'Recusada', cor: '#dc2626', bg: '#fee2e2' },
}

// Visão da DIT: todas as solicitações de vínculo a setor, com decisão inline.
export default function Solicitacoes() {
  const { data: todas = [], isLoading, isError } = useSolicitacoesDivisao()
  const aprovar = useAprovarSolicitacao()
  const recusar = useRecusarSolicitacao()

  const [abaStatus, setAbaStatus] = useState(0)
  const [busca, setBusca] = useState('')

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return todas.filter((s) => {
      if (s.status !== abaStatus) return false
      if (q) {
        const blob = `${s.usuario.nome_completo} ${s.usuario.username} ${s.divisao.nome} ${s.divisao.secretaria}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [todas, abaStatus, busca])

  const contagem = useMemo(() => {
    const m = { 0: 0, 1: 0, 2: 0 }
    for (const s of todas) m[s.status] = (m[s.status] || 0) + 1
    return m
  }, [todas])

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      <header
        className="flex-shrink-0 px-6 pt-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight m-0 flex items-center gap-2" style={{ color: C.text1 }}>
              <UserPlus className="w-5 h-5" strokeWidth={1.75} style={{ color: C.accent }} />
              Solicitações de setor
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              Pedidos de vínculo a divisões - {contagem[0]} pendente{contagem[0] !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="relative min-w-[220px]">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              strokeWidth={1.75}
              style={{ color: C.text3 }}
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pessoa ou setor…"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Object.entries(STATUS_META).map(([st, meta]) => {
            const stN = Number(st)
            const ativo = abaStatus === stN
            return (
              <button
                key={st}
                onClick={() => setAbaStatus(stN)}
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors"
                style={{
                  color: ativo ? C.accentInk : C.text2,
                  borderBottom: `2px solid ${ativo ? C.accent : 'transparent'}`,
                  marginBottom: '-1px',
                }}
              >
                {meta.label}s
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: ativo ? '#eef0ff' : C.surface2, color: ativo ? C.accentInk : C.text3 }}
                >
                  {contagem[stN]}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <Estado icon={Loader2} spin texto="Carregando solicitações…" />
          ) : isError ? (
            <Estado icon={AlertCircle} texto="Erro ao carregar solicitações." />
          ) : filtradas.length === 0 ? (
            <div
              className="text-center py-16 rounded-lg"
              style={{ backgroundColor: C.surface, border: `1px dashed ${C.border2}`, color: C.text3 }}
            >
              <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <div className="text-[13px]">
                Nenhuma solicitação {STATUS_META[abaStatus].label.toLowerCase()}.
              </div>
            </div>
          ) : (
            <ul className="list-none p-0 m-0 space-y-3">
              {filtradas.map((s) => (
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
                      {' '}→ <span className="font-medium">{s.divisao.secretaria} · {s.divisao.nome}</span>
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: C.text3 }}>
                      Pedido em {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      {s.decidido_em && ` · decidido por ${s.decidido_por_nome || '-'} em ${new Date(s.decidido_em).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>

                  {s.status === 0 ? (
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
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0"
                      style={{ backgroundColor: STATUS_META[s.status].bg, color: STATUS_META[s.status].cor }}
                    >
                      {STATUS_META[s.status].label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
