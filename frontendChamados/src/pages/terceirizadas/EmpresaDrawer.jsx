import { useEffect } from 'react'
import { X, Phone, ExternalLink, Pencil, Plus, Ticket, Clock } from 'lucide-react'
import { RESP_META, STATUS_META, formatarDataHora } from './data'

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

export default function EmpresaDrawer({ empresa, onClose, onEditar }) {
  const meta = RESP_META[empresa.responsabilidade]
  const Icone = meta.icon

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Chamados ativos primeiro
  const chamadosOrdenados = [...empresa.chamados].sort((a, b) => {
    if (a.status !== b.status) return a.status - b.status
    return b.aberto_em.localeCompare(a.aberto_em)
  })

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
            backgroundImage: `linear-gradient(135deg, ${meta.cor}14 0%, ${meta.cor}05 100%)`,
            borderBottom: `1px solid ${C.divider}`,
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center"
                style={{
                  backgroundColor: `${meta.cor}1f`,
                  border: `1px solid ${meta.cor}55`,
                }}
              >
                <Icone className="w-6 h-6" strokeWidth={1.75} style={{ color: meta.cor }} />
              </div>
              <div className="min-w-0">
                <div className="text-[16px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
                  {empresa.nome}
                </div>
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight mt-1"
                  style={{
                    backgroundColor: `${meta.cor}1a`,
                    color: meta.cor,
                    border: `1px solid ${meta.cor}44`,
                  }}
                >
                  {meta.label}
                </span>
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

          {/* Contato */}
          <div className="space-y-1 text-[12px]" style={{ color: C.text2 }}>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
              <a
                href={`tel:${empresa.numero_telefone.replace(/\D/g, '')}`}
                className="hover:underline"
                style={{ color: C.text1 }}
              >
                {empresa.numero_telefone}
              </a>
            </div>
            {empresa.link_site && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
                <a
                  href={`https://${empresa.link_site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: C.text1 }}
                >
                  {empresa.link_site}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Lista de chamados delegados */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between"
            style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.divider}` }}
          >
            <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: C.text3 }}>
              Chamados delegados
            </div>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}
            >
              {empresa.chamados.length}
            </span>
          </div>

          {chamadosOrdenados.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px]" style={{ color: C.text3 }}>
              Nenhum chamado delegado.
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {chamadosOrdenados.map((c) => (
                <ChamadoItem key={c.id} chamado={c} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer com ações */}
        <div
          className="flex-shrink-0 px-5 py-3 flex items-center justify-between gap-2"
          style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}` }}
        >
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors"
            style={{ color: C.text2 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            Delegar chamado
          </button>
          <button
            onClick={() => onEditar?.(empresa)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Editar empresa
          </button>
        </div>
      </aside>
    </>
  )
}

function ChamadoItem({ chamado }) {
  const meta = STATUS_META[chamado.status]
  return (
    <li
      className="px-5 py-3 transition-colors"
      style={{ borderBottom: `1px solid ${C.divider}` }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surface2)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: C.text1 }}>
            {chamado.titulo}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: C.text2 }}>
            <span
              className="font-mono font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#eef0ff', color: '#2d2783' }}
              title="Protocolo da empresa"
            >
              {chamado.protocolo}
            </span>
            <span className="flex items-center gap-1" style={{ color: C.text3 }}>
              <Ticket className="w-3 h-3" strokeWidth={1.75} />
              <span className="font-mono">{chamado.chamado_interno}</span>
            </span>
          </div>
        </div>

        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
          style={{
            backgroundColor: `${meta.cor}14`,
            color: meta.cor,
            border: `1px solid ${meta.cor}44`,
          }}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: C.text3 }}>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" strokeWidth={1.75} />
          Aberto {formatarDataHora(chamado.aberto_em)}
        </span>
        {chamado.finalizado_em && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={1.75} />
            Encerrado {formatarDataHora(chamado.finalizado_em)}
          </span>
        )}
      </div>
    </li>
  )
}
