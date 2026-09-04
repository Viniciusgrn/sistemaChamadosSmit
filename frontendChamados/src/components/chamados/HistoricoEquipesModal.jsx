import { useEffect } from 'react'
import { X, Users } from 'lucide-react'

// Histórico de TODAS as equipes que passaram pelo chamado, uma passagem por
// atendimento — quem estava, quando, como terminou e o que anotaram.
// Compartilhado entre a gestão (TicketModal) e o campo (ChamadoDetalhe):
// é a mesma pergunta nas duas telas — "quem mexeu nisso?".

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  border:   '#ececea',
  border2:  '#e3e2df',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
}

// Atendimento.MOTIVO_ENCERRAMENTO_CHOICES — 0 é o que "resolve" o chamado
const MOTIVO_META = {
  0: { cor: '#16a34a', bg: '#dcfce7' },   // Resolvido
  1: { cor: '#2563eb', bg: '#e5edff' },   // Transferido
  2: { cor: '#6b7280', bg: '#f1f1ef' },   // Turno acabou
  3: { cor: '#b91c1c', bg: '#fee2e2' },   // Cancelado
}

function dataHora(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoricoEquipesModal({ chamado, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // já vem da API da mais recente pra mais antiga
  const passagens = chamado.atendimentos || []

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.45)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
              Equipes do chamado #{chamado.code}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ color: C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {passagens.length === 0 ? (
            <div className="text-center py-10 text-[13px]" style={{ color: C.text3 }}>
              Nenhuma equipe passou por este chamado ainda.
            </div>
          ) : (
            <ul className="list-none p-0 m-0 space-y-3">
              {passagens.map((a) => {
                const meta = MOTIVO_META[a.motivo] || {}
                const emCurso = !a.encerrado_em
                return (
                  <li
                    key={a.id}
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[13px] font-medium min-w-0" style={{ color: C.text1 }}>
                        {a.tecnicos.length ? a.tecnicos.join(', ') : 'Equipe sem registro de técnicos'}
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 whitespace-nowrap"
                        style={
                          emCurso
                            ? { backgroundColor: '#eef2ff', color: '#4338ca' }
                            : { backgroundColor: meta.bg || C.surface, color: meta.cor || C.text2 }
                        }
                      >
                        {emCurso ? 'Em atendimento' : (a.motivo_display || '—')}
                      </span>
                    </div>

                    <div className="text-[11px] mt-1" style={{ color: C.text3 }}>
                      {dataHora(a.iniciado_em) || '—'}
                      {a.encerrado_em && ` → ${dataHora(a.encerrado_em)}`}
                    </div>

                    {a.observacoes && (
                      <div
                        className="text-[12px] mt-1.5 pt-1.5 whitespace-pre-wrap"
                        style={{ color: C.text2, borderTop: `1px dashed ${C.border}` }}
                      >
                        {a.observacoes}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
