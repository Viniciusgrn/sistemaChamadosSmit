import { useState } from 'react'
import { MapPin, ArrowRight, Pencil } from 'lucide-react'

const CHIPS_LIMITE = 4

const C = {
  surface:    '#ffffff',
  surface2:   '#fbfaf7',
  hover:      '#f3f2ee',
  active:     '#eef0ff',
  border:     '#ececea',
  text1:      '#15161b',
  text2:      '#5b5e68',
  text3:      '#8b8d96',
  accent:     '#4f46e5',
  accentInk:  '#2d2783',
}

export default function ListaEnderecos({ enderecos, selecionado, onSelect, predioPorEndereco = {}, onAbrirPlanta, onEditar }) {
  if (enderecos.length === 0) {
    return (
      <div className="p-6 text-center text-sm" style={{ color: C.text3 }}>
        Nenhum endereço encontrado.
      </div>
    )
  }

  return (
    <ul className="list-none p-0 m-0" style={{ borderTop: `1px solid ${C.border}` }}>
      {enderecos.map((e) => (
        <EnderecoCard
          key={e.id}
          endereco={e}
          ativo={selecionado?.id === e.id}
          onClick={() => onSelect(e)}
          predioId={predioPorEndereco[e.id]}
          onAbrirPlanta={onAbrirPlanta}
          onEditar={onEditar}
        />
      ))}
    </ul>
  )
}

function EnderecoCard({ endereco, ativo, onClick, predioId, onAbrirPlanta, onEditar }) {
  const corPrimaria = endereco.unidades?.[0]?.secretaria?.cor || '#94a3b8'
  const temUnidades = endereco.unidades.length > 0
  const [expandido, setExpandido] = useState(false)

  const secretarias = []
  const vistos = new Set()
  for (const u of endereco.unidades) {
    if (u.secretaria && !vistos.has(u.secretaria.id)) {
      vistos.add(u.secretaria.id)
      secretarias.push(u.secretaria)
    }
  }

  const excedeu = secretarias.length > CHIPS_LIMITE
  const visiveis = expandido || !excedeu ? secretarias : secretarias.slice(0, CHIPS_LIMITE)
  const restantes = secretarias.length - CHIPS_LIMITE

  return (
    <li style={{ borderBottom: `1px solid ${C.border}` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault()
            onClick()
          }
        }}
        className="group relative w-full text-left p-4 transition-colors cursor-pointer outline-none"
        style={{ backgroundColor: ativo ? C.active : 'transparent' }}
        onMouseEnter={(e) => {
          if (!ativo) e.currentTarget.style.backgroundColor = C.hover
        }}
        onMouseLeave={(e) => {
          if (!ativo) e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {onEditar && (
          <button
            type="button"
            onClick={(ev) => { ev.stopPropagation(); onEditar(endereco) }}
            className="absolute top-2 right-2 w-7 h-7 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            style={{ color: C.text3, backgroundColor: C.surface }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eef0ff'; e.currentTarget.style.color = C.accentInk }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.surface; e.currentTarget.style.color = C.text3 }}
            title="Editar endereço"
            aria-label="Editar endereço"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center mt-0.5"
            style={{ backgroundColor: `${corPrimaria}1a`, border: `1px solid ${corPrimaria}55` }}
          >
            <MapPin className="w-4 h-4" strokeWidth={1.75} style={{ color: corPrimaria }} />
          </div>

          <div className="flex-1 min-w-0">
            {temUnidades ? (
              <ul className="list-none p-0 m-0 space-y-0.5">
                {endereco.unidades.map((u) => (
                  <li
                    key={u.id}
                    className="text-[13px] font-medium truncate flex items-center gap-1.5"
                    style={{ color: C.text1 }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: u.secretaria?.cor }}
                      title={u.secretaria?.nome}
                    />
                    <span className="truncate">{u.nome}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className="text-[13px] font-medium italic"
                style={{ color: C.text3 }}
              >
                Sem unidades vinculadas
              </div>
            )}
            <div className="text-[11px] mt-1.5 truncate" style={{ color: C.text2 }}>
              {endereco.rua}, {endereco.numero}
              <span className="mx-1.5" style={{ color: C.text3 }}>·</span>
              <span>{endereco.bairro?.nome}</span>
              {endereco.bairro?.rural && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider"
                  style={{ backgroundColor: '#fef3c7', color: '#854d0e' }}
                >
                  rural
                </span>
              )}
            </div>

            {endereco.ponto_referencia && (
              <div
                className="text-[11px] italic mt-0.5 line-clamp-1"
                style={{ color: C.text3 }}
              >
                {endereco.ponto_referencia}
              </div>
            )}

            {predioId != null && onAbrirPlanta && (
              <button
                onClick={(ev) => {
                  ev.stopPropagation()
                  onAbrirPlanta(predioId)
                }}
                className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: '#eef0ff',
                  color: '#2d2783',
                  border: '1px solid #d4d6ff',
                }}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.backgroundColor = '#4f46e5'
                  ev.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.backgroundColor = '#eef0ff'
                  ev.currentTarget.style.color = '#2d2783'
                }}
              >
                Visualizar planta
                <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </button>
            )}

            {secretarias.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {visiveis.map((s) => (
                  <span
                    key={s.id}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
                    style={{
                      backgroundColor: `${s.cor}14`,
                      color: s.cor,
                      border: `1px solid ${s.cor}44`,
                    }}
                    title={s.nome}
                  >
                    {s.sigla}
                  </span>
                ))}
                {excedeu && (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation()
                      setExpandido((v) => !v)
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight transition-colors"
                    style={{
                      backgroundColor: C.surface2,
                      color: C.text2,
                      border: `1px solid ${C.border}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#eef0ff'
                      e.currentTarget.style.color = '#2d2783'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = C.surface2
                      e.currentTarget.style.color = C.text2
                    }}
                    title={expandido ? 'Recolher' : 'Ver todas'}
                  >
                    {expandido ? '−' : `+${restantes}`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
