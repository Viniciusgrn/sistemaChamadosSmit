import { useEffect, useState } from 'react'
import { X, User, Layers, Building2, Pencil, ChevronRight, Plus } from 'lucide-react'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  hover:    '#f3f2ee',
  border:   '#e3e2df',
  divider:  '#ececea',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  accentInk:'#2d2783',
}

export default function SecretariaDrawer({ secretaria, onClose, onEditar }) {
  // ESC fecha
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[150] animate-fade-in"
        style={{ backgroundColor: 'rgba(20,22,36,0.3)' }}
      />

      {/* Drawer lateral */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-[151] w-full max-w-[480px] flex flex-col animate-slide-in"
        style={{
          backgroundColor: C.surface,
          borderLeft: `1px solid ${C.border}`,
          boxShadow: '-12px 0 40px -12px rgba(20,22,36,0.18)',
        }}
      >
        {/* Header colorido */}
        <div
          className="flex-shrink-0 px-5 py-5"
          style={{
            backgroundImage: `linear-gradient(135deg, ${secretaria.cor}14 0%, ${secretaria.cor}05 100%)`,
            borderBottom: `1px solid ${C.divider}`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center font-semibold tracking-tight"
                style={{
                  backgroundColor: `${secretaria.cor}1f`,
                  color: secretaria.cor,
                  border: `1px solid ${secretaria.cor}55`,
                  fontSize: secretaria.sigla.length > 3 ? '12px' : '15px',
                }}
              >
                {secretaria.sigla}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
                  {secretaria.nome}
                </div>
                <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: C.text2 }}>
                  <User className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
                  {secretaria.secretario || (
                    <span className="italic" style={{ color: C.text3 }}>Sem secretário definido</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded flex items-center justify-center transition-colors flex-shrink-0"
              style={{ color: C.text3 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
              aria-label="Fechar"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-[12px]" style={{ color: C.text2 }}>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: secretaria.cor }} />
              <span className="font-semibold" style={{ color: C.text1 }}>{secretaria.qtd_divisoes}</span>
              {secretaria.qtd_divisoes === 1 ? 'divisão' : 'divisões'}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: secretaria.cor }} />
              <span className="font-semibold" style={{ color: C.text1 }}>{secretaria.qtd_unidades}</span>
              {secretaria.qtd_unidades === 1 ? 'unidade' : 'unidades'}
            </span>
          </div>
        </div>

        {/* Conteúdo: divisões */}
        <div className="flex-1 overflow-y-auto">
          {secretaria.divisoes.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px]" style={{ color: C.text3 }}>
              Esta secretaria ainda não tem divisões cadastradas.
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {secretaria.divisoes.map((d) => (
                <DivisaoItem key={d.id} divisao={d} corSecretaria={secretaria.cor} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer com ações */}
        <div
          className="flex-shrink-0 px-5 py-3 flex items-center justify-between gap-2"
          style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}` }}
        >
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors"
            style={{ color: C.text2 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            Nova divisão
          </button>

          <button
            onClick={() => onEditar?.(secretaria)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
            Editar secretaria
          </button>
        </div>
      </aside>
    </>
  )
}

function DivisaoItem({ divisao, corSecretaria }) {
  const [aberto, setAberto] = useState(false)

  return (
    <li style={{ borderBottom: `1px solid ${C.divider}` }}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full px-5 py-3 flex items-center gap-3 transition-colors text-left"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <ChevronRight
          className="w-3.5 h-3.5 transition-transform flex-shrink-0"
          strokeWidth={2}
          style={{
            color: C.text3,
            transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: C.text1 }}>
            {divisao.nome}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: C.text3 }}>
            <span
              className="font-mono px-1 py-0.5 rounded mr-1.5"
              style={{ backgroundColor: `${corSecretaria}14`, color: corSecretaria }}
            >
              {divisao.sigla}
            </span>
            {divisao.unidades.length} {divisao.unidades.length === 1 ? 'unidade' : 'unidades'}
          </div>
        </div>
      </button>

      {aberto && divisao.unidades.length > 0 && (
        <ul
          className="list-none p-0 m-0 pb-1"
          style={{ backgroundColor: C.surface2 }}
        >
          {divisao.unidades.map((u) => (
            <li
              key={u.id}
              className="pl-12 pr-5 py-1.5 text-[12px] flex items-center gap-2"
              style={{ color: C.text2 }}
            >
              <Building2 className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
              <span className="truncate">{u.nome}</span>
            </li>
          ))}
        </ul>
      )}

      {aberto && divisao.unidades.length === 0 && (
        <div
          className="pl-12 pr-5 pb-2 pt-1 text-[11px] italic"
          style={{ color: C.text3, backgroundColor: C.surface2 }}
        >
          Sem unidades vinculadas.
        </div>
      )}
    </li>
  )
}
