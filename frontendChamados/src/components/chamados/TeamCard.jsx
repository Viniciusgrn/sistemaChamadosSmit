import { Car, MapPin, Clock } from 'lucide-react'
import { TEAM_STATUS_META } from "../../pages/chamados/data"

export default function TeamCard({ team, onClick }) {
  const meta = TEAM_STATUS_META[team.status]

  // Espaçamento entre avatares: equipes pequenas respiram mais, grandes se compactam
  const n = team.members.length
  const gapAvatares =
    n <= 2 ? 32 :
    n === 3 ? 22 :
    n === 4 ? 16 :
              12

  return (
    <div
      onClick={onClick}
      className="rounded-lg p-4 flex flex-col gap-3 cursor-pointer transition-all"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e3e2df',
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
        minHeight: 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#c8c7c3'
        e.currentTarget.style.boxShadow = '0 4px 15px 4px rgba(20,22,36,0.08), 0 1px 3px rgba(20,22,36,0.06)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e3e2df'
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(20,22,36,0.04)'
      }}
    >
      <div
        className="flex items-start justify-center flex-wrap"
        style={{ gap: `${gapAvatares}px` }}
      >
        {team.members.map((m) => (
          <div key={m.initials} className="flex flex-col items-center gap-1 min-w-0">
            <div
              className="w-9 h-9 rounded-full inline-flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0 leading-none"
              style={{
                backgroundColor: m.color,
                boxShadow: `0 1px 30px 2px ${m.color}90`,
              }}
              title={m.name}
            >
              {m.initials}
            </div>
            <div className="text-[10px] truncate max-w-[64px] text-center" style={{ color: '#5b5e68' }}>
              {m.name}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, backgroundColor: '#ececea' }} />
      <div
        className="flex items-center gap-1.5 text-[11px] font-medium leading-none"
        style={{ color: meta.color }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta.color }}
        />
        {meta.label}
      </div>

      <div>
        {team.activeTicket ? (
          <>
            <div className="font-mono text-[12px] font-semibold" style={{ color: '#15161b' }}>
              {team.activeTicket.code}
            </div>
            <div className="text-[12px] mt-0.5 line-clamp-2" style={{ color: '#5b5e68' }}>
              {team.activeTicket.title}
            </div>
          </>
        ) : (
          <div className="text-[12px] italic" style={{ color: '#8b8d96' }}>
            Sem chamado ativo
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 text-[11px]" style={{ color: '#5b5e68' }}>
        <div
          className="flex items-center gap-1.5 min-w-0 leading-none"
          title={`${team.vehicle.plate} · ${team.vehicle.model}`}
        >
          <Car className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: '#8b8d96' }} />
          <span className="truncate">
            <span className="font-mono font-semibold" style={{ color: '#15161b' }}>
              {team.vehicle.plate}
            </span>
            {' · '}
            {team.vehicle.model}
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0 leading-none" title={team.location}>
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: '#8b8d96' }} />
          <span className="truncate">{team.location}</span>
        </div>
        {team.tempoAtendimento && (
          <div className="flex items-center gap-1.5 min-w-0 leading-none" title="Tempo em atendimento">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: '#8b8d96' }} />
            <span className="truncate">Tempo em atendimento: {team.tempoAtendimento}</span>
          </div>
        )}
      </div>
    </div>
  )
}
