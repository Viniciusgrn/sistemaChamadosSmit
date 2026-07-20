import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'

const C = {
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  border:    '#e3e2df',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

export default function AgendarEventoModal({ veiculo, onClose, onSalvar }) {
  const [data, setData] = useState('')
  const [motivo, setMotivo] = useState('')
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const podeSalvar = data.trim() && motivo.trim() && tipo.trim()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!podeSalvar) return
    onSalvar({
      automovel_id: veiculo.id,
      data,
      motivo: motivo.trim(),
      tipo_agendamento: tipo.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(20,22,36,0.5)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h2 className="m-0 text-[14px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Agendar evento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors"
            style={{ color: C.text3 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f2ee'; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div
          className="px-5 py-3 text-[12px]"
          style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border}`, color: C.text2 }}
        >
          Veículo:{' '}
          <span className="font-mono font-semibold" style={{ color: C.text1 }}>
            {veiculo.placa}
          </span>
          {' · '}
          {veiculo.marca} {veiculo.modelo}
        </div>

        <div className="px-5 py-4 space-y-4">
          <Campo label="Data" required>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              required
            />
          </Campo>

          <Campo label="Motivo" required>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Lavagem completa"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              required
              autoFocus
            />
          </Campo>

          <Campo label="Tipo de agendamento" required>
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ex.: lavagem, manutenção preventiva"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </Campo>
        </div>

        <div
          className="px-5 py-3 flex items-center justify-end gap-2"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[12px] transition-colors"
            style={{ color: C.text2 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f2ee'; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!podeSalvar}
            className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: podeSalvar ? C.accent : '#c7c5d9',
              color: '#fff',
              cursor: podeSalvar ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => { if (podeSalvar) e.currentTarget.style.backgroundColor = C.accentInk }}
            onMouseLeave={(e) => { if (podeSalvar) e.currentTarget.style.backgroundColor = C.accent }}
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}

function Campo({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
      {hint && (
        <div className="text-[10px] mt-1" style={{ color: C.text3 }}>
          {hint}
        </div>
      )}
    </div>
  )
}
