import { Printer, Monitor, Phone, Cpu, Ticket, MapPin, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { STATUS, STATUS_META, TIPO_EQ } from './data'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  border:   '#e3e2df',
  divider:  '#ececea',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
}

const TIPO_ICONE = {
  [TIPO_EQ.IMPRESSORA]: { icon: Printer, cor: '#475569' },
  [TIPO_EQ.COMPUTADOR]: { icon: Cpu,     cor: '#2563eb' },
  [TIPO_EQ.MONITOR]:    { icon: Monitor, cor: '#0891b2' },
  [TIPO_EQ.TELEFONE]:   { icon: Phone,   cor: '#ca8a04' },
}

export default function ManutencaoCard({ manutencao: m, onClick }) {
  const status = STATUS_META[m.status]
  const tipoMeta = TIPO_ICONE[m.equipamento.tipo]
  const Icone = tipoMeta.icon
  const ehComputador = m.equipamento.tipo === TIPO_EQ.COMPUTADOR
  const backupPendente = ehComputador && !m.backup && m.status === STATUS.EM_ANDAMENTO

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          onClick()
        }
      }}
      className="rounded-lg overflow-hidden cursor-pointer transition-all outline-none"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = status.cor
        e.currentTarget.style.boxShadow = `0 4px 12px -4px ${status.cor}40, 0 1px 3px rgba(20,22,36,0.06)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(20,22,36,0.04)'
      }}
    >
      {/* Topo: equipamento + status + backup */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div
          className="flex-shrink-0 w-11 h-11 rounded-md flex items-center justify-center"
          style={{
            backgroundColor: `${tipoMeta.cor}1a`,
            border: `1px solid ${tipoMeta.cor}44`,
          }}
        >
          <Icone className="w-5 h-5" strokeWidth={1.75} style={{ color: tipoMeta.cor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[13px] font-semibold" style={{ color: C.text1 }}>
              {m.equipamento.patrimonio}
            </span>
            <span className="text-[13px] truncate" style={{ color: C.text2 }}>
              {m.equipamento.marca} {m.equipamento.modelo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
              style={{ backgroundColor: status.bg, color: status.cor }}
            >
              {status.label}
            </span>

            {ehComputador && (
              backupPendente ? (
                <BackupBadge tom="alerta" texto="Backup pendente" Icon={ShieldAlert} />
              ) : m.backup ? (
                <BackupBadge tom="ok" texto="Backup feito" Icon={ShieldCheck} />
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* Diagnóstico */}
      <div
        className="px-5 py-3 text-[12px] line-clamp-2"
        style={{ color: C.text1, borderTop: `1px solid ${C.divider}` }}
      >
        {m.diagnostico}
      </div>

      {/* Linha de meta */}
      <div
        className="px-5 py-2.5 grid grid-cols-2 gap-3 text-[11px]"
        style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}`, color: C.text2 }}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Ticket className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
          <span className="font-mono font-semibold flex-shrink-0" style={{ color: C.text1 }}>
            {m.chamado_codigo}
          </span>
        </span>
        <span className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
          <span className="truncate">{m.localizacao_atual}</span>
        </span>
      </div>

      {/* Rodapé: técnicos + tempos */}
      <div
        className="px-5 py-2.5 flex items-center justify-between gap-3"
        style={{ borderTop: `1px solid ${C.divider}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex -space-x-1.5 flex-shrink-0">
            {m.tecnicos.map((t) => (
              <div
                key={t.id}
                className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 leading-none"
                style={{
                  backgroundColor: t.cor,
                  boxShadow: 'inset 0 0 0 2px #fff',
                }}
                title={t.primeiro_nome}
              >
                {t.primeiro_nome[0]}
              </div>
            ))}
          </div>
          <span className="text-[11px] truncate" style={{ color: C.text2 }}>
            {m.tecnicos.map((t) => t.primeiro_nome).join(' + ')}
          </span>
        </div>

        <span className="text-[11px] flex items-center gap-1 flex-shrink-0" style={{ color: C.text3 }}>
          <Clock className="w-3 h-3" strokeWidth={1.75} />
          {m.concluida_em ? `${m.iniciada_em} – ${m.concluida_em}` : `desde ${m.iniciada_em}`}
        </span>
      </div>
    </li>
  )
}

function BackupBadge({ tom, texto, Icon }) {
  const paleta = tom === 'ok'
    ? { fg: '#14532d', bg: '#dcfce7', borda: '#86efac' }
    : { fg: '#7c2d12', bg: '#fef3c7', borda: '#fcd34d' }
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
      style={{ backgroundColor: paleta.bg, color: paleta.fg, border: `1px solid ${paleta.borda}` }}
    >
      <Icon className="w-2.5 h-2.5" strokeWidth={2} />
      {texto}
    </span>
  )
}
