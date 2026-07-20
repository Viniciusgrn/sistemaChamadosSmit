export default function KpiCard({ label, value, suffix, delta, Icon, deltaDir }) {
  const deltaColor =
    deltaDir === 'up'   ? '#16a34a' :
    deltaDir === 'down' ? '#dc2626' :
                          '#5b5e68'

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-1.5"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e3e2df',
        boxShadow: `0 3px 15px -4px ${deltaColor}`,
      }}
    >
      <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#5b5e68' }}>
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />}
        {label}
      </div>
      <div
        className="text-[28px] font-bold tracking-tight leading-none flex items-baseline gap-1.5"
        style={{ color: '#15161b' }}
      >
        {value}
        {suffix && (
          <span className="text-[13px] font-semibold" style={{ color: '#8b8d96' }}>
            {suffix}
          </span>
        )}
      </div>
      {delta && (
        <div className="text-[11px] font-medium" style={{ color: deltaColor }}>
          {delta}
        </div>
      )}
    </div>
  )
}
