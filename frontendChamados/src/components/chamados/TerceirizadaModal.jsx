import { useEffect } from "react"
import { X, ExternalLink, Briefcase, Ticket as TicketIcon, Clock } from 'lucide-react'
import { TERC_STATUS_META, TERCEIRIZADAS_META } from "../../pages/chamados/data"

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

// Modal de detalhe do ChamadoTerceirizada - espelha o model do back.
// O chamado interno relacionado é acessível via "Ver chamado interno".
export default function TerceirizadaModal({ item, onClose, onAbrirInterno }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!item) return null

  const empMeta = TERCEIRIZADAS_META[item.empresa] || {}
  const status = TERC_STATUS_META[item.status_chamado] || {}

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        {/* Header colorido com a cor da empresa */}
        <div
          className="px-5 py-4 flex items-start justify-between gap-4"
          style={{
            backgroundImage: `linear-gradient(135deg, ${empMeta.bg || '#f1f5f9'} 0%, ${empMeta.bg || '#f1f5f9'}88 100%)`,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Briefcase
                className="w-4 h-4 flex-shrink-0"
                strokeWidth={1.75}
                style={{ color: empMeta.dot || C.text3 }}
              />
              <span
                className="text-[13px] font-semibold tracking-tight"
                style={{ color: empMeta.fg || C.text1 }}
              >
                {item.empresa}
              </span>
              <span
                className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight leading-none"
                style={{
                  backgroundColor: status.bg,
                  color: status.fg,
                  color: status.fg,
                  boxShadow: '0 1px 2px rgba(20,22,36,0.06)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                {status.label}
              </span>
            </div>
            <div className="font-mono text-[14px] font-bold" style={{ color: C.text1 }}>
              {item.protocolo}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: C.text2 }}>
              Protocolo da empresa
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
          {/* Vínculo com chamado interno */}
          <div
            className="rounded-md p-3 mb-4"
            style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
          >
            <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: C.text3 }}>
              Chamado interno relacionado
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <TicketIcon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
                  <span className="font-mono text-[13px] font-semibold" style={{ color: C.text1 }}>
                    {item.chamado_interno.code}
                  </span>
                </div>
                <div className="text-[12px] truncate" style={{ color: C.text2 }}>
                  {item.chamado_interno.title}
                </div>
              </div>
              <button
                onClick={() => onAbrirInterno?.(item.chamado_interno)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors flex-shrink-0"
                style={{ backgroundColor: C.surface, color: C.text1, border: `1px solid ${C.border2}` }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.surface)}
              >
                Ver chamado interno
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <Bloco label="Descrição recebida da empresa">
            <p className="m-0 text-[13px] whitespace-pre-wrap" style={{ color: C.text1 }}>
              {item.descricao || (
                <em style={{ color: C.text3 }}>Sem descrição registrada.</em>
              )}
            </p>
          </Bloco>

          <Bloco label="Linha do tempo">
            <div className="space-y-2">
              <Linha
                Icon={Clock}
                cor={status.dot}
                label="Aberto"
                quando={item.aberto_em}
              />
              {item.finalizado_em && (
                <Linha
                  Icon={Clock}
                  cor={status.dot}
                  label="Encerrado"
                  quando={item.finalizado_em}
                />
              )}
              {!item.finalizado_em && (
                <Linha
                  Icon={Clock}
                  cor={C.text3}
                  label="Aguardando retorno da empresa"
                  quando="em andamento"
                  pendente
                />
              )}
            </div>
          </Bloco>
        </div>

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
        </div>
      </div>
    </div>
  )
}

function Bloco({ label, children }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: '#8b8d96' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Linha({ Icon, cor, label, quando, pendente }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-full inline-flex items-center justify-center flex-shrink-0" style={{ backgroundColor: pendente ? '#fbfaf7' : `${cor}1a`, border: `1px solid ${pendente ? '#e3e2df' : `${cor}55`}`,}}>
        <Icon className="w-3 h-3" strokeWidth={2} style={{ color: pendente ? '#8b8d96' : cor }} />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-medium" style={{ color: pendente ? '#8b8d96' : '#15161b' }}>
          {label}
        </div>
        <div className="text-[11px]" style={{ color: pendente ? '#8b8d96' : '#5b5e68' }}>
          {quando}
        </div>
      </div>
    </div>
  )
}
