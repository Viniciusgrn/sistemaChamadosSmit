import { useEffect } from 'react'
import { X, Pencil, MapPin, Hash, Tag, Ticket, Wrench } from 'lucide-react'
import {
  TIPO_META,
  STATUS_META,
  SEED_HISTORICO_CHAMADOS,
  SEED_HISTORICO_MANUTENCOES,
  CHAMADO_STATUS_META,
  MANUT_STATUS_META,
} from './data'

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

export default function EquipamentoDrawer({ equipamento, onClose, onEditar }) {
  const tipo = TIPO_META[equipamento.tipo]
  const status = STATUS_META[equipamento.status]
  const Icone = tipo.icon
  const chamados = SEED_HISTORICO_CHAMADOS[equipamento.id] || []
  const manutencoes = SEED_HISTORICO_MANUTENCOES[equipamento.id] || []

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
        className="fixed top-0 right-0 bottom-0 z-[151] w-full max-w-[560px] flex flex-col animate-slide-in"
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
            backgroundImage: `linear-gradient(135deg, ${tipo.cor}14 0%, ${tipo.cor}05 100%)`,
            borderBottom: `1px solid ${C.divider}`,
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center"
                style={{
                  backgroundColor: `${tipo.cor}1f`,
                  border: `1px solid ${tipo.cor}55`,
                }}
              >
                <Icone className="w-6 h-6" strokeWidth={1.75} style={{ color: tipo.cor }} />
              </div>
              <div className="min-w-0">
                <div className="text-[16px] font-semibold tracking-tight truncate" style={{ color: C.text1 }}>
                  {equipamento.marca} {equipamento.modelo}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
                    style={{
                      backgroundColor: `${tipo.cor}14`,
                      color: tipo.cor,
                      border: `1px solid ${tipo.cor}44`,
                    }}
                  >
                    {tipo.label}
                  </span>
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
        </div>

        {/* Identificação */}
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.divider}` }}>
          <InfoLinha icon={Tag}    label="Patrimônio"      valor={<span className="font-mono">{equipamento.patrimonio}</span>} />
          <InfoLinha icon={Hash}   label="Número de série" valor={<span className="font-mono">{equipamento.numero_de_serie}</span>} />
          <InfoLinha icon={MapPin} label="Unidade atual"   valor={equipamento.unidade || <em style={{ color: C.text3 }}>- sem unidade</em>} />
        </div>

        {/* Histórico de chamados */}
        <div className="flex-1 overflow-y-auto">
          <Secao titulo="Chamados envolvendo este equipamento" contador={chamados.length} icone={Ticket}>
            {chamados.length === 0 ? (
              <EmptySec mensagem="Sem chamados registrados." />
            ) : (
              <ul className="list-none p-0 m-0">
                {chamados.map((c, i) => {
                  const sm = CHAMADO_STATUS_META[c.status]
                  return (
                    <li
                      key={i}
                      className="px-5 py-3"
                      style={{ borderBottom: `1px solid ${C.divider}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-[11px] font-semibold" style={{ color: C.text1 }}>
                              {c.chamado}
                            </span>
                            <span className="text-[12px] truncate" style={{ color: C.text2 }}>
                              {c.titulo}
                            </span>
                          </div>
                          <div className="text-[10px] mt-1" style={{ color: C.text3 }}>
                            {c.data}
                          </div>
                        </div>
                        {sm && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
                            style={{
                              backgroundColor: `${sm.cor}14`,
                              color: sm.cor,
                              border: `1px solid ${sm.cor}44`,
                            }}
                          >
                            {sm.label}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Secao>

          {/* Histórico de manutenções */}
          <Secao titulo="Manutenções" contador={manutencoes.length} icone={Wrench}>
            {manutencoes.length === 0 ? (
              <EmptySec mensagem="Sem manutenções registradas." />
            ) : (
              <ul className="list-none p-0 m-0">
                {manutencoes.map((m) => {
                  const sm = MANUT_STATUS_META[m.status]
                  return (
                    <li
                      key={m.id}
                      className="px-5 py-3"
                      style={{ borderBottom: `1px solid ${C.divider}` }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="text-[12px] flex-1 min-w-0" style={{ color: C.text1 }}>
                          {m.diagnostico}
                        </div>
                        {sm && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
                            style={{
                              backgroundColor: `${sm.cor}14`,
                              color: sm.cor,
                              border: `1px solid ${sm.cor}44`,
                            }}
                          >
                            {sm.label}
                          </span>
                        )}
                      </div>
                      {m.servico_executado && (
                        <div className="text-[11px] italic" style={{ color: C.text2 }}>
                          {m.servico_executado}
                        </div>
                      )}
                      <div className="text-[10px] mt-1" style={{ color: C.text3 }}>
                        {m.data_inicio}{m.data_fim ? ` – ${m.data_fim}` : ' · em andamento'}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Secao>
        </div>

        {/* Footer */}
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
            <Wrench className="w-3.5 h-3.5" strokeWidth={1.75} />
            Mandar pra manutenção
          </button>
          <button
            onClick={() => onEditar?.(equipamento)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Editar
          </button>
        </div>
      </aside>
    </>
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

function Secao({ titulo, contador, icone: Icon, children }) {
  return (
    <div>
      <div
        className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.divider}` }}
      >
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium" style={{ color: C.text3 }}>
          <Icon className="w-3 h-3" strokeWidth={1.75} />
          {titulo}
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}
        >
          {contador}
        </span>
      </div>
      {children}
    </div>
  )
}

function EmptySec({ mensagem }) {
  return (
    <div className="px-5 py-6 text-center text-[12px]" style={{ color: C.text3 }}>
      {mensagem}
    </div>
  )
}
