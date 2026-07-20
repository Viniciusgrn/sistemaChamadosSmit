import { useEffect } from 'react'
import {
  X, Pencil, Printer, Monitor, Phone, Cpu, Ticket, MapPin,
  ShieldCheck, ShieldAlert, Clock, Wrench, CheckCircle2, XCircle,
} from 'lucide-react'
import { STATUS, STATUS_META, TIPO_EQ } from './data'

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

const TIPO_ICONE = {
  [TIPO_EQ.IMPRESSORA]: { icon: Printer, cor: '#475569' },
  [TIPO_EQ.COMPUTADOR]: { icon: Cpu,     cor: '#2563eb' },
  [TIPO_EQ.MONITOR]:    { icon: Monitor, cor: '#0891b2' },
  [TIPO_EQ.TELEFONE]:   { icon: Phone,   cor: '#ca8a04' },
}

export default function ManutencaoDrawer({ manutencao: m, onClose, onEditar }) {
  const status = STATUS_META[m.status]
  const tipoMeta = TIPO_ICONE[m.equipamento.tipo]
  const Icone = tipoMeta.icon
  const ehComputador = m.equipamento.tipo === TIPO_EQ.COMPUTADOR

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
            backgroundImage: `linear-gradient(135deg, ${status.cor}14 0%, ${status.cor}05 100%)`,
            borderBottom: `1px solid ${C.divider}`,
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${tipoMeta.cor}1f`, border: `1px solid ${tipoMeta.cor}55` }}
              >
                <Icone className="w-6 h-6" strokeWidth={1.75} style={{ color: tipoMeta.cor }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[14px] font-semibold" style={{ color: C.text1 }}>
                    {m.equipamento.patrimonio}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
                    style={{ backgroundColor: status.bg, color: status.cor }}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="text-[13px] mt-1 truncate" style={{ color: C.text2 }}>
                  {m.equipamento.marca} {m.equipamento.modelo}
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

          {/* Chamado + localização */}
          <div className="grid grid-cols-1 gap-1.5 text-[12px]" style={{ color: C.text2 }}>
            <div className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
              <span>Chamado original:{' '}
                <span className="font-mono font-semibold" style={{ color: C.text1 }}>{m.chamado_codigo}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
              <span className="truncate" style={{ color: C.text1 }}>{m.localizacao_atual}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Diagnóstico */}
          <Bloco titulo="Diagnóstico">
            <p className="m-0 text-[13px] whitespace-pre-wrap" style={{ color: C.text1 }}>
              {m.diagnostico}
            </p>
          </Bloco>

          {/* Serviço executado */}
          <Bloco titulo="Serviço executado">
            {m.servico_executado ? (
              <p className="m-0 text-[13px] whitespace-pre-wrap" style={{ color: C.text1 }}>
                {m.servico_executado}
              </p>
            ) : (
              <p className="m-0 text-[12px] italic" style={{ color: C.text3 }}>
                Pendente - preencher ao finalizar.
              </p>
            )}
          </Bloco>

          {/* Backup (só pra computadores) */}
          {ehComputador && (
            <Bloco titulo="Backup">
              {m.backup ? (
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} style={{ color: '#16a34a' }} />
                  <div className="text-[13px]" style={{ color: C.text1 }}>
                    Backup realizado em <strong>{m.backup_data}</strong>
                    <div className="text-[11px] mt-0.5" style={{ color: C.text2 }}>
                      Feito por {m.backup_feito_por}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} style={{ color: '#ca8a04' }} />
                  <div className="text-[13px]" style={{ color: '#7c2d12' }}>
                    <strong>Backup pendente.</strong>
                    <div className="text-[11px] mt-0.5" style={{ color: C.text2 }}>
                      Computadores exigem backup antes de prosseguir com a manutenção.
                    </div>
                  </div>
                </div>
              )}
            </Bloco>
          )}

          {/* Técnicos */}
          <Bloco titulo="Técnicos responsáveis">
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {m.tecnicos.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0 leading-none"
                    style={{
                      backgroundColor: t.cor,
                      boxShadow: `0 2px 6px -1px ${t.cor}55`,
                    }}
                  >
                    {t.primeiro_nome[0]}
                  </div>
                  <span className="text-[13px]" style={{ color: C.text1 }}>{t.primeiro_nome}</span>
                </li>
              ))}
            </ul>
          </Bloco>

          {/* Timeline */}
          <Bloco titulo="Linha do tempo">
            <ol className="list-none p-0 m-0 flex flex-col gap-3">
              <Etapa
                Icon={Wrench}
                cor="#ea580c"
                label="Iniciada"
                quando={m.iniciada_em}
                feita
              />
              {ehComputador && m.backup && (
                <Etapa
                  Icon={ShieldCheck}
                  cor="#16a34a"
                  label="Backup realizado"
                  quando={m.backup_data}
                  feita
                />
              )}
              {m.status === STATUS.FINALIZADO && (
                <Etapa
                  Icon={CheckCircle2}
                  cor="#16a34a"
                  label="Finalizada"
                  quando={m.concluida_em}
                  feita
                />
              )}
              {m.status === STATUS.NAO_REALIZADA && (
                <Etapa
                  Icon={XCircle}
                  cor="#dc2626"
                  label="Encerrada sem conserto"
                  quando={m.concluida_em}
                  feita
                />
              )}
              {m.status === STATUS.EM_ANDAMENTO && (
                <Etapa
                  Icon={Clock}
                  cor={C.text3}
                  label="Aguardando conclusão"
                  quando="em andamento"
                />
              )}
            </ol>
          </Bloco>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 py-3 flex items-center justify-end gap-2"
          style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}` }}
        >
          <button
            onClick={() => onEditar?.(m)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Editar manutenção
          </button>
        </div>
      </aside>
    </>
  )
}

function Bloco({ titulo, children }) {
  return (
    <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <div className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: C.text3 }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function Etapa({ Icon, cor, label, quando, feita }) {
  return (
    <li className="flex items-start gap-3">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: feita ? `${cor}1a` : '#fbfaf7',
          border: `1px solid ${feita ? `${cor}55` : '#e3e2df'}`,
        }}
      >
        <Icon className="w-3 h-3" strokeWidth={2} style={{ color: feita ? cor : '#8b8d96' }} />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-medium" style={{ color: feita ? '#15161b' : '#8b8d96' }}>
          {label}
        </div>
        <div className="text-[11px]" style={{ color: feita ? '#5b5e68' : '#8b8d96' }}>
          {quando}
        </div>
      </div>
    </li>
  )
}
