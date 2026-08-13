import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, MapPin, Users, ChevronUp, ChevronDown, Crosshair } from 'lucide-react'

import { PRIORITY_META } from '../../pages/chamados/data'
import { STATUS_ABERTOS } from './TicketsTable'

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

const ORDEM_PRIO = { baixa: 0, media: 1, alta: 2, urgente: 3 }

// Pino da unidade. `quantidade > 1` escreve o número dentro do pino, pra que
// dois chamados no mesmo endereço não pareçam um só.
function pinChamado(cor, isUrgent, quantidade = 1) {
  const miolo = quantidade > 1
    ? `<circle cx="16" cy="16" r="8" fill="#ffffff"/>
       <text x="16" y="20" text-anchor="middle" font-size="11" font-weight="700"
             font-family="system-ui, sans-serif" fill="${cor}">${quantidade}</text>`
    : `<circle cx="16" cy="16" r="6" fill="#ffffff"/>`
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
      ${isUrgent ? `<circle cx="16" cy="16" r="15" fill="${cor}" opacity="0.18"/>` : ''}
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28c0-8.84-7.16-16-16-16z"
            fill="${cor}" stroke="#ffffff" stroke-width="2"/>
      ${miolo}
    </svg>`
  return L.icon({
    // unescape/encodeURIComponent: btoa quebra com acento no SVG
    iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
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

  // Só o que ainda está em aberto. Antes o corte era `status !== 'resolvido'`,
  // que deixava cancelado e finalizado entrarem no mapa.
  const chamadosVisiveis = useMemo(
    () => tickets.filter(
      (t) => STATUS_ABERTOS.includes(t.status) && t.latitude && t.longitude
    ),
    [tickets]
  )

  // Uma unidade costuma ter mais de um chamado aberto (o Paço, sempre): sem
  // agrupar, os pinos empilham no mesmo ponto e só o de cima é clicável.
  const pontosNoMapa = useMemo(() => {
    const porLocal = new Map()
    for (const t of chamadosVisiveis) {
      const chave = `${t.latitude},${t.longitude}`
      if (!porLocal.has(chave)) {
        porLocal.set(chave, {
          chave,
          latitude: t.latitude,
          longitude: t.longitude,
          address: t.address,
          client: t.client,
          chamados: [],
        })
      }
      porLocal.get(chave).chamados.push(t)
    }
    // a cor do pino segue o chamado mais urgente daquela unidade
    return [...porLocal.values()].map((p) => ({
      ...p,
      chamados: [...p.chamados].sort((a, b) => ORDEM_PRIO[b.priority] - ORDEM_PRIO[a.priority]),
    }))
  }, [chamadosVisiveis])

  // "Em campo" é quem se deslocou: equipe atendendo chamado EXTERNO. Quem está
  // num chamado do Paço não está em campo, está no próprio prédio — e todas
  // essas cairiam empilhadas no mesmo pino.
  const equipesEmCampo = useMemo(
    () => teams.filter((t) => t.activeTicket && !t.interno && t.latitude && t.longitude),
    [teams]
  )

  // Contagem por prioridade pra legenda
  const contagem = useMemo(() => {
    const c = { urgente: 0, alta: 0, media: 0, baixa: 0 }
    chamadosVisiveis.forEach((t) => { c[t.priority] = (c[t.priority] || 0) + 1 })
    return c
  }, [chamadosVisiveis])

  const pontos = useMemo(() => [
    ...pontosNoMapa.map((p) => [p.latitude, p.longitude]),
    ...equipesEmCampo.map((e) => [e.latitude, e.longitude]),
  ], [pontosNoMapa, equipesEmCampo])

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
                {chamadosVisiveis.length} em aberto
                {' · '}
                {pontosNoMapa.length} unidade{pontosNoMapa.length !== 1 ? 's' : ''}
                {equipesEmCampo.length > 0 && ` · ${equipesEmCampo.length} equipe${equipesEmCampo.length !== 1 ? 's' : ''} em campo`}
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

            {/* Um pino por unidade com chamado aberto */}
            {pontosNoMapa.map((p) => {
              const topo = p.chamados[0]                      // o mais urgente
              const cor = PRIO_COR[topo.priority] || '#94a3b8'
              return (
                <Marker
                  key={`un-${p.chave}`}
                  position={[p.latitude, p.longitude]}
                  icon={pinChamado(cor, topo.priority === 'urgente', p.chamados.length)}
                  zIndexOffset={topo.priority === 'urgente' ? 1000 : 0}
                >
                  {/* maxWidth menor que o padrão (300) + folga no autoPan:
                      em 375px o balão do pino perto da borda vazava a tela */}
                  <Popup maxWidth={240} autoPanPadding={[16, 16]}>
                    {/* max-w evita o balão estourar a lateral em 375px */}
                    <div className="text-[13px] leading-snug min-w-[180px] max-w-[240px]">
                      <div className="font-semibold text-neutral-900">{p.client}</div>
                      <div className="text-neutral-600 mt-0.5">{p.address}</div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-2 mb-1">
                        {p.chamados.length} chamado{p.chamados.length > 1 ? 's' : ''} em aberto
                      </div>
                      <ul className="list-none p-0 m-0 space-y-1 max-h-[132px] overflow-y-auto">
                        {p.chamados.map((t) => (
                          <li key={t.code} className="flex items-start gap-1.5">
                            <span
                              className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PRIO_COR[t.priority] }}
                              title={PRIORITY_META[t.priority]?.label}
                            />
                            <span className="font-mono text-[11px] font-semibold flex-shrink-0" style={{ color: C.text3 }}>
                              {t.code}
                            </span>
                            <span className="text-neutral-700 min-w-0 break-words">{t.title}</span>
                          </li>
                        ))}
                      </ul>
                      {p.chamados.some((t) => t.team) && (
                        <div
                          className="mt-2 pt-2 border-t border-neutral-200 text-[11px] flex items-center gap-1.5"
                          style={{ color: '#1e3a8a' }}
                        >
                          <Users className="w-3 h-3" strokeWidth={1.75} />
                          equipe em atendimento aqui
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
                <Popup maxWidth={240} autoPanPadding={[16, 16]}>
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
