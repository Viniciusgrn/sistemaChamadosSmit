import { STATUS_META, PRIORITY_META } from "../../pages/chamados/data"

// Avatar circular com iniciais - sempre centralizado vertical/horizontal
export const Avatar = ({ initials, color, size = 28 }) => (
  <div
    className="inline-flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0 leading-none"
    style={{
      backgroundColor: color,
      width: size,
      height: size,
      fontSize: Math.round(size * 0.4),
      letterSpacing: '0.02em',
    }}
  >
    {initials}
  </div>
)

// Chip de status - centralizado + shadow leve.
// Sempre mostra o status do chamado interno (chamados com terceirizadas
// aparecem como "Em andamento" - pra ver a empresa, ir na aba dedicada).
export const StatusChip = ({ s }) => {
  const m = STATUS_META[s] || {}
  return (
    <span
      className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight leading-none whitespace-nowrap"
      style={{
        backgroundColor: m.bg,
        color: m.fg,
        boxShadow: '0 1px 2px rgba(20,22,36,0.06)',
        minWidth: 92,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: m.dot }}
      />
      {m.curto || m.label}
    </span>
  )
}

// Chip de prioridade - centralizado + shadow leve
// `escalonada` = subiu sozinha por tempo em aberto, ninguém definiu na mão.
// A seta deixa isso explícito pro despachante não achar que alguém mexeu.
export const PriorityCell = ({ p, escalonada, dias }) => {
  const m = PRIORITY_META[p] || {}
  const isUrgent = p === 'urgente'
  return (
    <span
      className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight leading-none"
      style={{
        backgroundColor: m.bg,
        color: m.fg,
        boxShadow: '0 1px 2px rgba(20,22,36,0.06)',
        minWidth: 72,
      }}
      title={escalonada ? `Subiu sozinha: ${dias} dias em aberto` : undefined}
    >
      {isUrgent && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: '#ffffff' }}
        />
      )}
      {m.label}
      {escalonada && <span className="flex-shrink-0 leading-none">↑</span>}
    </span>
  )
}
