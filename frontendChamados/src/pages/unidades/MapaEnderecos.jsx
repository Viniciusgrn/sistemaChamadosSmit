import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair } from 'lucide-react'

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
    if (!endereco) return
    // setView em vez de flyTo: a animação do flyTo é engolida pelo
    // invalidateSize que roda junto (mesmo motivo do fitBounds aqui do lado),
    // e o mapa ficava parado no zoom inicial ao chegar pelo link de um chamado
    map.invalidateSize()
    map.setView([Number(endereco.latitude), Number(endereco.longitude)], 16, { animate: false })
  }, [endereco, map])
  return null
}

/**
 * Enquadra o mapa nos endereços que estão em tela.
 *
 * Com zoom fixo, filtrar por secretaria ou buscar por bairro deixava os
 * resultados fora da vista — e numa tela de celular não dá pra "procurar
 * arrastando". Também corrige o tamanho do container, que nasce zerado quando
 * o mapa monta dentro de uma aba.
 */
function EnquadrarNosPinos({ enderecos, expandirPara, temAlvo }) {
  const map = useMap()
  const chave = enderecos.map((e) => e.id).join(',')

  useEffect(() => {
    // Coordenada zerada é endereço sem geocodificação: entrar no cálculo
    // jogaria o enquadramento pro meio do Atlântico.
    const pontos = enderecos
      .filter((e) => Number(e.latitude) && Number(e.longitude))
      .map((e) => [Number(e.latitude), Number(e.longitude)])

    const enquadrar = () => {
      if (!pontos.length) return
      // invalidateSize ANTES: o container pode ter nascido com tamanho zero
      // (aba oculta, layout ainda montando) e o fitBounds usaria a medida velha
      map.invalidateSize()
      // animate:false é obrigatório aqui — o invalidateSize logo acima inicia
      // uma animação de pan, e um fitBounds animado em seguida é descartado
      // silenciosamente (o mapa fica no zoom inicial e metade dos pinos some)
      if (pontos.length === 1) map.setView(pontos[0], 16, { animate: false })
      else map.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 16, animate: false })
    }

    // O botão de reenquadrar continua disponível mesmo quando há alvo.
    expandirPara?.(enquadrar)

    // Veio de um chamado ("ver no mapa"): quem manda no enquadramento é o
    // FlyToSelected, que centraliza naquele endereço. Enquadrar tudo aqui
    // brigaria com ele e a pessoa perderia o ponto que foi ver.
    if (temAlvo) {
      // sem timeout: um invalidateSize atrasado cancelaria o voo do FlyToSelected
      map.invalidateSize()
      return
    }

    enquadrar()
    // reenquadra depois do layout assentar (animação de entrada, teclado…)
    const t = setTimeout(enquadrar, 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, chave])

  return null
}

export default function MapaEnderecos({ enderecos, selecionado, onSelect, predioPorEndereco = {}, onAbrirPlanta }) {
  const markerRefs = useRef({})
  const reenquadrarRef = useRef(null)

  useEffect(() => {
    if (!selecionado) return
    // O marcador pode ainda não ter registrado a ref quando a seleção chega de
    // fora (link "Ver no mapa" de um chamado): tenta de novo no próximo tick.
    let tentativas = 0
    let t
    const abrir = () => {
      const marcador = markerRefs.current[selecionado.id]
      if (marcador?.openPopup) { marcador.openPopup(); return }
      // o <Popup> é filho do <Marker> e só é vinculado depois; insiste um pouco
      if (++tentativas < 8) t = setTimeout(abrir, 60)
    }
    abrir()
    return () => clearTimeout(t)
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
                {/* max-w segura o balão dentro da tela em 375px */}
                <div className="text-[13px] leading-snug max-w-[240px]">
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
                      className="mt-2 w-full px-2.5 min-h-[40px] rounded text-[12px] font-medium transition-colors"
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

        <EnquadrarNosPinos
          enderecos={enderecos}
          expandirPara={(fn) => { reenquadrarRef.current = fn }}
          temAlvo={!!selecionado}
        />
        <FlyToSelected endereco={selecionado} />
      </MapContainer>

      {/* Voltar a ver todos os endereços do filtro atual */}
      <button
        onClick={() => reenquadrarRef.current?.()}
        className="absolute top-3 right-3 w-11 h-11 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e3e2df',
          boxShadow: '0 2px 8px rgba(20,22,36,0.15)',
          color: '#5b5e68',
          zIndex: 500,
        }}
        aria-label="Enquadrar todos os endereços"
        title="Enquadrar todos os endereços"
      >
        <Crosshair className="w-5 h-5" strokeWidth={1.75} />
      </button>
    </div>
  )
}
