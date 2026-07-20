import { Plus } from 'lucide-react'

export default function Slot({ tecnico, onClick, disabled }) {
  if (tecnico) return <SlotPreenchido tecnico={tecnico} />
  return <SlotVazio onClick={onClick} disabled={disabled} />
}

function SlotPreenchido({ tecnico }) {
  const iniciais = tecnico.nome_completo
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col items-center gap-1.5 animate-fade-in">
      <div
        className="relative w-16 h-16 rounded-full inline-flex items-center justify-center text-[15px] font-semibold text-white flex-shrink-0 leading-none"
        style={{
          backgroundColor: tecnico.cor,
          boxShadow: `0 5px 30px 5px ${tecnico.cor}90`,
        }}
        title={`${tecnico.nome_completo}`}
      >
        {iniciais}
      </div>
      <div className="text-[11px] font-medium text-[#15161b] truncate max-w-[80px] text-center">
        {tecnico.primeiro_nome}
      </div>
    </div>
  )
}

function SlotVazio({ onClick, disabled }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group w-16 h-16 rounded-full flex items-center justify-center transition-all"
        style={{
          backgroundColor: '#fbfaf7',
          border: '2px dashed #d4d3cf',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (disabled) return
          e.currentTarget.style.borderColor = '#4f46e5'
          e.currentTarget.style.backgroundColor = '#eef0ff'
          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(79,70,229,0.08)'
        }}
        onMouseLeave={(e) => {
          if (disabled) return
          e.currentTarget.style.borderColor = '#d4d3cf'
          e.currentTarget.style.backgroundColor = '#fbfaf7'
          e.currentTarget.style.boxShadow = 'none'
        }}
        aria-label="Entrar no slot"
      >
        <Plus
          className="w-5 h-5 transition-colors"
          strokeWidth={2}
          style={{ color: '#3f4f98' }}
        />
      </button>
      <div className="text-[11px] text-[#8b8d96] truncate max-w-[80px] text-center">
        livre
      </div>
    </div>
  )
}
