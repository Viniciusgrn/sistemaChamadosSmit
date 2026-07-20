// Renderiza a imagem real da planta + overlay das salas como polígonos (SVG).
// Cada sala guarda uma lista de vértices [[x,y],…] em % (0-100) da imagem,
// então suporta qualquer formato (L, trapézio…), não só retângulos.
// Hover bidirecional: hover na sala "acende" e sincroniza com a lista lateral.

const C = {
  bg:    '#f7f7f4',
  text1: '#15161b',
  text2: '#5b5e68',
  text3: '#8b8d96',
}

// centróide simples (média dos vértices) pra posicionar o label
function centroide(pontos) {
  if (!pontos.length) return [50, 50]
  const s = pontos.reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0])
  return [s[0] / pontos.length, s[1] / pontos.length]
}

export default function PlantaPaco({ planta, salaAtivaId, onHoverSala }) {
  if (!planta) return null
  const salas = planta.salas || []

  return (
    <div className="h-full w-full flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
      <div
        className="relative max-w-5xl w-full"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(20,22,36,0.10))' }}
      >
        <img
          src={planta.imagem}
          alt={planta.nome || `Andar ${planta.andar}`}
          className="w-full h-auto block rounded-md select-none"
          draggable={false}
        />

        {/* Overlay SVG: viewBox 0-100 = coords em %; preserveAspectRatio none
            faz o SVG esticar exatamente sobre a imagem. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {salas.map((sala) => {
            const pontos = Array.isArray(sala.pontos) ? sala.pontos : []
            if (pontos.length < 3) return null
            const cor = sala.divisao?.secretaria?.cor || '#8b8d96'
            const ativo = salaAtivaId === sala.id
            const pts = pontos.map(([x, y]) => `${x},${y}`).join(' ')
            const [cx, cy] = centroide(pontos)
            const texto = sala.divisao?.sigla || sala.label || ''

            return (
              <g
                key={sala.id}
                onMouseEnter={() => onHoverSala?.(sala.id)}
                onMouseLeave={() => onHoverSala?.(null)}
                style={{ cursor: 'pointer' }}
              >
                <polygon
                  points={pts}
                  fill={cor}
                  fillOpacity={ativo ? 0.4 : 0.13}
                  stroke={cor}
                  strokeOpacity={ativo ? 1 : 0.55}
                  strokeWidth={ativo ? 0.5 : 0.3}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: 'fill-opacity .15s, stroke-opacity .15s' }}
                />
                {texto && (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={ativo ? '#fff' : cor}
                    style={{
                      // fonte em unidades de viewBox (%) - pequena e legível
                      fontSize: 2,
                      fontWeight: 700,
                      paintOrder: 'stroke',
                      stroke: ativo ? cor : 'rgba(255,255,255,0.85)',
                      strokeWidth: 0.6,
                      strokeLinejoin: 'round',
                      pointerEvents: 'none',
                    }}
                  >
                    {texto}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
