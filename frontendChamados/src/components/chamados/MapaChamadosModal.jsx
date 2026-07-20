import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, MapPin, Users } from 'lucide-react'

import { PRIORITY_META } from '../../pages/chamados/data'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  border:   '#e3e2df',
  divider:  '#2563eb',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
}

// Cores por prioridade (pino do mapa)
const PRIO_COR = {
  urgente: '#dc2626',
  alta:    '#ea580c',
  media:   '#ca8a04',
  baixa:   '#16a34a',
}

// Pino genérico colorido (chamado)
function pinChamado(cor, isUrgent) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
      ${isUrgent ? `<circle cx="16" cy="16" r="15" fill="${cor}" opacity="0.18"/>` : ''}
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28c0-8.84-7.16-16-16-16z"
            fill="${cor}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#ffffff"/>
    </svg>`
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -40],
  })
}

// Marcador de equipe (formato diferente - círculo com 'E')
function pinEquipe(cor) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="${cor}" stroke="#ffffff" stroke-width="3"/>
      <path d="M12 15 L18 11 L24 15 L24 22 C24 24 22 26 18 26 C14 26 12 24 12 22 Z"
            fill="#ffffff" opacity="0.95"/>
      <circle cx="18" cy="16" r="2.5" fill="${cor}"/>
    </svg>`
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -16],
  })
}

const CENTRO_DEFAULT = [-22.9519, -46.5419]   // Centro
const ZOOM_DEFAULT = 14

export default function MapaChamadosModal({ tickets = [], teams = [], onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Chamados não resolvidos com coordenadas
  const chamadosVisiveis = useMemo(
    () => tickets.filter((t) => t.status !== 'resolvido' && t.latitude && t.longitude),
    [tickets]
  )

  // Equipes em atendimento (têm chamado ativo + coords)
  const equipesEmCampo = useMemo(
    () => teams.filter((t) => t.activeTicket && t.latitude && t.longitude),
    [teams]
  )

  // Contagem por prioridade pra legenda
  const contagem = useMemo(() => {
    const c = { urgente: 0, alta: 0, media: 0, baixa: 0 }
    chamadosVisiveis.forEach((t) => { c[t.priority] = (c[t.priority] || 0) + 1 })
    return c
  }, [chamadosVisiveis])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.55)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full max-w-[1080px] max-h-[88vh] rounded-lg overflow-hidden flex flex-col"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.4)',
        }}
      > 
        <div
          className="flex-shrink-0 px-5 py-3 flex items-center justify-between gap-4"
          style={{ borderBottom: `1px solid ${C.divider}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-md inline-flex items-center justify-center"
              style={{ backgroundColor: '#ccd1fb' }}
            >
              <MapPin className="w-4.5 h-4.5" strokeWidth={1.75} style={{ color: '#4f46e5' }} />
            </div>
            <div className="min-w-0">
              <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
                Mapa dos chamados
              </h3>
              <div className="text-[11px] mt-0.5" style={{ color: C.text2 }}>
                {chamadosVisiveis.length} chamado{chamadosVisiveis.length !== 1 ? 's' : ''} ativo{chamadosVisiveis.length !== 1 ? 's' : ''}
                {' · '}
                {equipesEmCampo.length} equipe{equipesEmCampo.length !== 1 ? 's' : ''} em campo
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors"
            style={{ color: C.text3 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f2ee'; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative" style={{ backgroundColor: '#f7f7f4' }}>
          <MapContainer
            center={CENTRO_DEFAULT}
            zoom={ZOOM_DEFAULT}
            scrollWheelZoom
            className="h-full w-full"
            style={{ backgroundColor: '#f7f7f4' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Pins de chamados */}
            {chamadosVisiveis.map((t) => {
              const cor = PRIO_COR[t.priority] || '#94a3b8'
              return (
                <Marker
                  key={`tk-${t.code}`}
                  position={[t.latitude, t.longitude]}
                  icon={pinChamado(cor, t.priority === 'urgente')}
                  zIndexOffset={t.priority === 'urgente' ? 1000 : 0}
                >
                  <Popup>
                    <div className="text-[13px] leading-snug min-w-[200px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="font-mono text-[11px] font-semibold"
                          style={{ color: C.text3 }}
                        >
                          {t.code}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider leading-none"
                          style={{
                            backgroundColor: PRIORITY_META[t.priority]?.bg,
                            color: PRIORITY_META[t.priority]?.fg,
                          }}
                        >
                          {PRIORITY_META[t.priority]?.label}
                        </span>
                      </div>
                      <div className="font-semibold text-neutral-900">{t.title}</div>
                      <div className="text-neutral-600 mt-0.5">{t.address}</div>
                      <div className="text-neutral-500 italic text-[11px] mt-1.5">
                        {t.client}
                      </div>
                      {t.team && (
                        <div
                          className="mt-2 pt-2 border-t border-neutral-200 text-[11px] flex items-center gap-1.5"
                          style={{ color: '#1e3a8a' }}
                        >
                          <Users className="w-3 h-3" strokeWidth={1.75} />
                          Equipe <strong className="font-semibold">{t.team}</strong> atendendo
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            {/* Pins de equipes em campo */}
            {equipesEmCampo.map((eq) => (
              <Marker
                key={`eq-${eq.id}`}
                position={[eq.latitude, eq.longitude]}
                icon={pinEquipe('#2563eb')}
                zIndexOffset={2000}
              >
                <Popup>
                  <div className="text-[13px] leading-snug min-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: '#2563eb' }} />
                      <span className="font-mono text-[11px] font-semibold" style={{ color: '#1e3a8a' }}>
                        {eq.id}
                      </span>
                    </div>
                    <div className="font-semibold text-neutral-900">{eq.name}</div>
                    <div className="text-neutral-600 mt-0.5">
                      <span className="font-mono">{eq.vehicle.plate}</span> · {eq.vehicle.model}
                    </div>
                    {eq.activeTicket && (
                      <div className="mt-2 pt-2 border-t border-neutral-200">
                        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                          Atendendo
                        </div>
                        <div className="font-mono text-[11px] font-semibold">{eq.activeTicket.code}</div>
                        <div className="text-neutral-700">{eq.activeTicket.title}</div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Legenda flutuante */}
          <div
            className="absolute bottom-4 left-4 rounded-md px-3 py-2.5"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.divider}`,
              boxShadow: '0 4px 12px 1px #2563eb',
              zIndex: 500,
            }}
          >
            <div className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: C.text3 }}>
              Legenda
            </div>
            <div className="flex flex-col gap-1 text-[11px]" style={{ color: C.text1 }}>
              {Object.entries(PRIO_COR).map(([k, cor]) => (
                <div key={k} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cor }}
                  />
                  <span className="capitalize">{PRIORITY_META[k]?.label || k}</span>
                  <span className="ml-auto font-mono text-[10px]" style={{ color: C.text3 }}>
                    {contagem[k]}
                  </span>
                </div>
              ))}
              
              <div className="mt-1.5 pt-1.5 border-t flex items-center gap-2" style={{ borderColor: C.divider }}>
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 inline-flex items-center justify-center"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  <Users className="w-2 h-2 text-white" strokeWidth={2.5} />
                </span>
                <span>Equipe em campo</span>
                <span className="ml-auto font-mono text-[10px]" style={{ color: C.text3 }}>
                  {equipesEmCampo.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
