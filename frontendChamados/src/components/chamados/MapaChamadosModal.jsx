import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, MapPin, Users, ChevronUp, ChevronDown, Crosshair } from 'lucide-react'

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

/**
 * Enquadra o mapa em todos os pinos.
 *
 * Numa tela de celular o zoom fixo costuma deixar metade dos chamados fora da
 * vista, e não dá pra "dar uma olhada geral" sem arrastar. `botao` faz o mesmo
 * enquadramento sob demanda, depois que a pessoa mexeu no mapa.
 */
function Enquadrar({ pontos, aoPronto }) {
  const map = useMap()
  useEffect(() => {
    const fn = () => enquadra(map, pontos)
    aoPronto?.(fn)
    fn()
    // o container nasce com 0px enquanto o modal anima: refaz depois
    const t = setTimeout(fn, 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(pontos)])
  return null
}

function enquadra(map, pontos) {
  if (!pontos.length) return
  map.invalidateSize()
  // animate:false: fitBounds animado logo após invalidateSize é descartado
  if (pontos.length === 1) {
    map.setView(pontos[0], 16, { animate: false })
    return
  }
  map.fitBounds(L.latLngBounds(pontos), { padding: [48, 48], maxZoom: 16, animate: false })
}

export default function MapaChamadosModal({ tickets = [], teams = [], onClose }) {
  // no celular a legenda ocupa um terço da tela: começa recolhida
  const [legendaAberta, setLegendaAberta] = useState(
    typeof window === 'undefined' ? true : window.innerWidth >= 640
  )
  const [reenquadrar, setReenquadrar] = useState(null)

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

  const pontos = useMemo(() => [
    ...chamadosVisiveis.map((t) => [t.latitude, t.longitude]),
    ...equipesEmCampo.map((e) => [e.latitude, e.longitude]),
  ], [chamadosVisiveis, equipesEmCampo])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.55)' }}
      onClick={onClose}
    >
      {/* Celular: ocupa a tela toda — mapa com margem é mapa pequeno demais.
          Desktop: volta a ser um card centralizado. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full sm:max-w-[1080px] sm:max-h-[88vh] sm:rounded-lg overflow-hidden flex flex-col"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.4)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className="flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3"
          style={{ borderBottom: `1px solid ${C.divider}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-md hidden sm:inline-flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#ccd1fb' }}
            >
              <MapPin className="w-4.5 h-4.5" strokeWidth={1.75} style={{ color: '#4f46e5' }} />
            </div>
            <div className="min-w-0">
              <h3 className="m-0 text-[14px] sm:text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
                Mapa dos chamados
              </h3>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: C.text2 }}>
                {chamadosVisiveis.length} chamado{chamadosVisiveis.length !== 1 ? 's' : ''} ativo{chamadosVisiveis.length !== 1 ? 's' : ''}
                {' · '}
                {equipesEmCampo.length} equipe{equipesEmCampo.length !== 1 ? 's' : ''} em campo
              </div>
            </div>
          </div>

          {/* 44px: alvo de toque mínimo confortável no celular */}
          <button
            onClick={onClose}
            className="w-11 h-11 -mr-2 sm:w-8 sm:h-8 sm:mr-0 rounded flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={1.75} />
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
            <Enquadrar pontos={pontos} aoPronto={(fn) => setReenquadrar(() => fn)} />

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
                    {/* max-w evita o balão estourar a lateral em 375px */}
                    <div className="text-[13px] leading-snug min-w-[180px] max-w-[240px]">
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
                  <div className="text-[13px] leading-snug min-w-[180px] max-w-[240px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: '#2563eb' }} />
                      <span className="font-mono text-[11px] font-semibold" style={{ color: '#1e3a8a' }}>
                        {eq.id}
                      </span>
                    </div>
                    <div className="font-semibold text-neutral-900">{eq.name}</div>
                    {/* equipe pode não ter carro (atendimento interno) */}
                    <div className="text-neutral-600 mt-0.5">
                      {eq.vehicle
                        ? <><span className="font-mono">{eq.vehicle.plate}</span> · {eq.vehicle.model}</>
                        : <span className="italic">sem veículo</span>}
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

          {/* Voltar a ver tudo: no celular é fácil se perder arrastando */}
          <button
            onClick={() => reenquadrar?.()}
            className="absolute top-3 right-3 w-11 h-11 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: '0 2px 8px rgba(20,22,36,0.15)',
              color: C.text2,
              zIndex: 500,
            }}
            aria-label="Enquadrar todos os pontos"
            title="Enquadrar todos os pontos"
          >
            <Crosshair className="w-5 h-5" strokeWidth={1.75} />
          </button>

          {/* Legenda: recolhida por padrão no celular, onde ela comeria um
              terço do mapa. No desktop nasce aberta. */}
          <div
            className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-auto rounded-lg overflow-hidden"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: '0 2px 12px rgba(20,22,36,0.18)',
              zIndex: 500,
            }}
          >
            <button
              onClick={() => setLegendaAberta((v) => !v)}
              className="w-full min-h-[40px] px-3 flex items-center gap-2 text-[11px] font-medium"
              style={{ color: C.text2 }}
            >
              <span className="uppercase tracking-wider">Legenda</span>
              <span className="flex items-center gap-1.5 ml-auto">
                {/* resumo visível mesmo recolhida */}
                {Object.entries(PRIO_COR).map(([k, cor]) => (
                  contagem[k] > 0 && (
                    <span key={k} className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
                      <span className="font-mono text-[10px]">{contagem[k]}</span>
                    </span>
                  )
                ))}
                {legendaAberta
                  ? <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
                  : <ChevronUp className="w-4 h-4" strokeWidth={1.75} />}
              </span>
            </button>

            {legendaAberta && (
              <div
                className="px-3 pb-2.5 pt-0.5 flex flex-col gap-1.5 text-[11px] sm:min-w-[180px]"
                style={{ color: C.text1, borderTop: `1px solid ${C.divider}` }}
              >
                {Object.entries(PRIO_COR).map(([k, cor]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cor }}
                    />
                    <span>{PRIORITY_META[k]?.label || k}</span>
                    <span className="ml-auto font-mono text-[10px]" style={{ color: C.text3 }}>
                      {contagem[k]}
                    </span>
                  </div>
                ))}
                <div className="mt-0.5 pt-1.5 border-t flex items-center gap-2" style={{ borderColor: C.divider }}>
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
