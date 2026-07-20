import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { MAPA_CENTRO, MAPA_ZOOM } from './data'

function makePinIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
            fill="${color}" stroke="#0d1f2d" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="#0d1f2d"/>
    </svg>`
  const url = `data:image/svg+xml;base64,${btoa(svg)}`
  return L.icon({
    iconUrl: url,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  })
}

function FlyToSelected({ endereco }) {
  const map = useMap()
  useEffect(() => {
    if (endereco) {
      map.flyTo([endereco.latitude, endereco.longitude], 16, { duration: 0.7 })
    }
  }, [endereco, map])
  return null
}

export default function MapaEnderecos({ enderecos, selecionado, onSelect, predioPorEndereco = {}, onAbrirPlanta }) {
  const markerRefs = useRef({})

  useEffect(() => {
    if (selecionado && markerRefs.current[selecionado.id]) {
      markerRefs.current[selecionado.id].openPopup()
    }
  }, [selecionado])

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={MAPA_CENTRO}
        zoom={MAPA_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
        style={{ backgroundColor: '#f7f7f4' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {enderecos.map((e) => {
          const cor = e.unidades?.[0]?.secretaria?.cor || '#94a3b8'
          const predioId = predioPorEndereco[e.id]
          return (
            <Marker
              key={e.id}
              position={[e.latitude, e.longitude]}
              icon={makePinIcon(cor)}
              ref={(ref) => { if (ref) markerRefs.current[e.id] = ref }}
              eventHandlers={{
                click: () => onSelect?.(e),
              }}
            >
              <Popup>
                <div className="text-[13px] leading-snug">
                  <div className="font-semibold text-neutral-900">
                    {e.rua}, {e.numero}
                  </div>
                  <div className="text-neutral-600">
                    {e.bairro?.nome}
                    {e.bairro?.rural ? ' · rural' : ''}
                  </div>
                  {e.ponto_referencia && (
                    <div className="text-neutral-500 italic text-[11px] mt-1">
                      {e.ponto_referencia}
                    </div>
                  )}
                  {e.unidades.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-neutral-200">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                        {e.unidades.length} unidade{e.unidades.length > 1 ? 's' : ''}
                      </div>
                      <ul className="space-y-0.5 p-0 m-0 list-none">
                        {e.unidades.map((u) => (
                          <li key={u.id} className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: u.secretaria?.cor }}
                            />
                            <span className="text-neutral-700 truncate">{u.nome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {predioId != null && onAbrirPlanta && (
                    <button
                      onClick={() => onAbrirPlanta(predioId)}
                      className="mt-2 w-full px-2.5 py-1.5 rounded text-[12px] font-medium transition-colors"
                      style={{ backgroundColor: '#4f46e5', color: '#fff' }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = '#2d2783')}
                      onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = '#4f46e5')}
                    >
                      Visualizar planta →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        <FlyToSelected endereco={selecionado} />
      </MapContainer>
    </div>
  )
}
