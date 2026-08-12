import { useEffect } from 'react'
import { X, Pencil, Building2, User, Briefcase, History, Clock } from 'lucide-react'
import { RESP_META, STATUS_META, MOTIVO_META } from './data'
import { useHistoricoTecnico } from '../../hooks/useTecnicos'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  hover:    '#f3f2ee',
  border:   '#e3e2df',
  divider:  '#ececea',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  accentInk:'#2d2783',
}

export default function TecnicoDrawer({ tecnico, onClose, onEditar }) {
  const status = STATUS_META[tecnico.status]
  const resps = (tecnico.responsabilidades || []).map((id) => RESP_META[id])
  const { data: historico = [] } = useHistoricoTecnico(tecnico.id)

  const iniciais = tecnico.nome_completo
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[150] animate-fade-in"
        style={{ backgroundColor: 'rgba(20,22,36,0.3)' }}
      />

      <aside
        className="fixed top-0 right-0 bottom-0 z-[151] w-full max-w-[520px] flex flex-col animate-slide-in"
        style={{
          backgroundColor: C.surface,
          borderLeft: `1px solid ${C.border}`,
          boxShadow: '-12px 0 40px -12px rgba(20,22,36,0.18)',
        }}
      >
        {/* Header colorido */}
        <div
          className="flex-shrink-0 px-5 py-5"
          style={{
            backgroundImage: `linear-gradient(135deg, ${tecnico.cor}1a 0%, ${tecnico.cor}05 100%)`,
            borderBottom: `1px solid ${C.divider}`,
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex-shrink-0 w-14 h-14 rounded-full inline-flex items-center justify-center text-[16px] font-semibold text-white leading-none"
                style={{
                  backgroundColor: tecnico.cor,
                  boxShadow: `0 6px 14px -2px ${tecnico.cor}66`,
                }}
              >
                {iniciais}
              </div>
              <div className="min-w-0">
                <div className="text-[16px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
                  {tecnico.nome_completo}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {tecnico.cargo_display && (
                    <span className="text-[11px] font-medium" style={{ color: C.text2 }}>
                      {tecnico.cargo_display}
                    </span>
                  )}
                  {tecnico.matricula && (
                    <span className="text-[11px] font-mono" style={{ color: C.text3 }}>
                      {tecnico.matricula}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {resps.map((r) => (
                    <span
                      key={r.label}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
                      style={{
                        backgroundColor: `${r.cor}14`,
                        color: r.cor,
                        border: `1px solid ${r.cor}44`,
                      }}
                    >
                      {r.label}
                    </span>
                  ))}
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
                    style={{ backgroundColor: status.bg, color: status.cor }}
                  >
                    {status.label}
                  </span>
                </div>
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

          {tecnico.contexto && (
            <div
              className="mt-3 px-3 py-2 rounded-md flex items-center gap-2 text-[12px]"
              style={{ backgroundColor: '#ffffff80', border: `1px solid ${C.border}`, color: C.text2 }}
            >
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
              <span>{tecnico.contexto.label}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div
          className="flex-shrink-0 grid grid-cols-3"
          style={{ borderBottom: `1px solid ${C.divider}` }}
        >
          <Stat label="Hoje"  valor={tecnico.atendimentos_hoje} sufixo="atend." />
          <Stat label="Mês"   valor={tecnico.atendimentos_mes}  sufixo="atend." borderL />
          <Stat label="Horas / mês" valor={tecnico.horas_campo_mes} sufixo="h" borderL />
        </div>

        {/* Informações */}
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.divider}` }}>
          <InfoLinha
            icon={Building2}
            label="Unidade lotada"
            valor={tecnico.unidade}
          />
          <InfoLinha
            icon={User}
            label="Chefe imediato"
            valor={tecnico.chefe_imediato || <em style={{ color: C.text3 }}>- sem chefe definido</em>}
          />
        </div>

        {/* Histórico */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between"
            style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.divider}` }}
          >
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium" style={{ color: C.text3 }}>
              <History className="w-3 h-3" strokeWidth={1.75} />
              Atendimentos recentes
            </div>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}
            >
              {historico.length}
            </span>
          </div>

          {historico.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px]" style={{ color: C.text3 }}>
              Sem atendimentos recentes.
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {historico.map((h) => (
                <AtendimentoItem key={h.id} item={h} tecnicoNome={tecnico.primeiro_nome} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 py-3 flex items-center justify-end gap-2"
          style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}` }}
        >
          <button
            onClick={() => onEditar?.(tecnico)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Editar técnico
          </button>
        </div>
      </aside>
    </>
  )
}

function Stat({ label, valor, sufixo, borderL }) {
  return (
    <div
      className="px-4 py-3"
      style={borderL ? { borderLeft: `1px solid ${C.divider}` } : undefined}
    >
      <div className="text-[18px] font-semibold tracking-tight leading-none" style={{ color: C.text1 }}>
        {valor}
        {sufixo && <span className="text-[11px] font-normal ml-1" style={{ color: C.text3 }}>{sufixo}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-wider mt-1.5" style={{ color: C.text3 }}>
        {label}
      </div>
    </div>
  )
}

function InfoLinha({ icon: Icon, label, valor }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.75} style={{ color: C.text3 }} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>{label}</div>
        <div className="text-[13px] mt-0.5 truncate" style={{ color: C.text1 }}>{valor}</div>
      </div>
    </div>
  )
}

// Formata "HH:MM" pra hoje, "dd/mm HH:MM" pros dias anteriores
function horaCurta(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const hoje = new Date()
  const mesmoDia = d.toDateString() === hoje.toDateString()
  return mesmoDia ? hora : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hora}`
}

function AtendimentoItem({ item, tecnicoNome }) {
  const motivo = item.motivo_encerramento != null ? MOTIVO_META[item.motivo_encerramento] : null
  const emAndamento = !item.encerrado_em
  // "com" = os outros da equipe, sem repetir o próprio técnico
  const parceiros = (item.parceiros || []).filter((p) => p !== tecnicoNome)
  return (
    <li
      className="px-5 py-3 transition-colors"
      style={{ borderBottom: `1px solid ${C.divider}` }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surface2)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-semibold" style={{ color: C.text1 }}>
              #{item.chamado}
            </span>
            <span className="text-[12px] truncate" style={{ color: C.text2 }}>
              {item.chamado_titulo}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: C.text3 }}>
            <Clock className="w-3 h-3" strokeWidth={1.75} />
            {horaCurta(item.iniciado_em)}
            {item.encerrado_em ? ` - ${horaCurta(item.encerrado_em)}` : ' · em andamento'}
            {parceiros.length > 0 && (
              <>
                <span style={{ color: C.text3 }}>·</span>
                <span>com {parceiros.join(', ')}</span>
              </>
            )}
          </div>
        </div>

        {emAndamento ? (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
            style={{ backgroundColor: '#dbeafe', color: '#1e3a8a' }}
          >
            Ativo
          </span>
        ) : motivo ? (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
            style={{ backgroundColor: `${motivo.cor}14`, color: motivo.cor, border: `1px solid ${motivo.cor}44` }}
          >
            {motivo.label}
          </span>
        ) : null}
      </div>
    </li>
  )
}
