import { useEffect, useState } from 'react'
import { X, Car, Trash2, Loader2 } from 'lucide-react'
import { COR_META, STATUS_META, COR, STATUS } from './data'
import { useCriarVeiculo, useEditarVeiculo, useExcluirVeiculo } from '../../hooks/useVeiculos'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  hover:    '#f3f2ee',
  border:   '#ececea',
  border2:  '#e3e2df',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  accentInk:'#2d2783',
  erro:     '#dc2626',
}

// Modal criar/editar/excluir veículo. `veiculo` null = criação.
export default function VeiculoModal({ veiculo, onClose }) {
  const editando = !!veiculo?.id

  const criar = useCriarVeiculo()
  const editar = useEditarVeiculo()
  const excluir = useExcluirVeiculo()

  const [form, setForm] = useState({
    placa:    veiculo?.placa || '',
    marca:    veiculo?.marca || '',
    modelo:   veiculo?.modelo || '',
    cor:      veiculo?.cor ?? COR.BRANCO,
    status:   veiculo?.status ?? STATUS.DISPONIVEL,
    assentos: veiculo?.assentos ?? 2,
  })
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const podeSalvar = form.placa.trim() && form.marca.trim() && form.modelo.trim() && form.assentos >= 1
  const salvando = criar.isPending || editar.isPending
  const erroMut = criar.error || editar.error || excluir.error

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    if (!podeSalvar || salvando) return
    const body = {
      placa: form.placa.trim().toUpperCase(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      cor: Number(form.cor),
      status: Number(form.status),
      assentos: Number(form.assentos),
    }
    const onOk = { onSuccess: onClose }
    if (editando) editar.mutate({ id: veiculo.id, ...body }, onOk)
    else criar.mutate(body, onOk)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {editando ? 'Editar veículo' : 'Novo veículo'}
            </h3>
          </div>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: C.text3 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Placa" required>
              <Input value={form.placa} onChange={(v) => update('placa', v.toUpperCase())} placeholder="ABC-1D23" autoFocus />
            </Campo>
            <Campo label="Assentos" required>
              <Input type="number" value={form.assentos} onChange={(v) => update('assentos', v)} placeholder="2" />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Marca" required>
              <Input value={form.marca} onChange={(v) => update('marca', v)} placeholder="Fiat" />
            </Campo>
            <Campo label="Modelo" required>
              <Input value={form.modelo} onChange={(v) => update('modelo', v)} placeholder="Strada" />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Cor">
              <Select value={form.cor} onChange={(v) => update('cor', v)} options={COR_META} />
            </Campo>
            <Campo label="Status">
              <Select value={form.status} onChange={(v) => update('status', v)} options={STATUS_META} />
            </Campo>
          </div>

          {erroMut && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {erroMut.status === 401 || erroMut.status === 403
                ? 'Sem permissão. Faça login no /admin e recarregue.'
                : erroMut.data?.placa
                  ? `Placa: ${erroMut.data.placa.join(' ')}`
                  : `Erro ao salvar${erroMut.status ? ` (${erroMut.status})` : ''}.`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          {editando ? (
            confirmandoExcluir ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: C.text2 }}>Confirmar?</span>
                <button type="button" onClick={() => excluir.mutate(veiculo.id, { onSuccess: onClose })} disabled={excluir.isPending}
                  className="px-2.5 py-1.5 rounded-md text-[12px] font-medium" style={{ backgroundColor: C.erro, color: '#fff' }}>
                  {excluir.isPending ? 'Excluindo…' : 'Sim, excluir'}
                </button>
                <button type="button" onClick={() => setConfirmandoExcluir(false)} className="px-2.5 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmandoExcluir(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] transition-colors" style={{ color: C.erro }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Excluir
              </button>
            )
          ) : <span />}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px] transition-colors" style={{ color: C.text2 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}>
              Cancelar
            </button>
            <button type="submit" disabled={!podeSalvar || salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ backgroundColor: (podeSalvar && !salvando) ? C.accent : '#c7c5d9', color: '#fff', cursor: (podeSalvar && !salvando) ? 'pointer' : 'not-allowed' }}
              onMouseEnter={(e) => { if (podeSalvar && !salvando) e.currentTarget.style.backgroundColor = C.accentInk }}
              onMouseLeave={(e) => { if (podeSalvar && !salvando) e.currentTarget.style.backgroundColor = C.accent }}>
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              {editando ? 'Salvar' : 'Criar veículo'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Campo({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#5b5e68' }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, autoFocus, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
      style={{ backgroundColor: '#fbfaf7', border: '1px solid #ececea', color: '#15161b' }}
      onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
      onBlur={(e) => (e.currentTarget.style.borderColor = '#ececea')}
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
      style={{ backgroundColor: '#fbfaf7', border: '1px solid #ececea', color: '#15161b' }}
    >
      {Object.entries(options).map(([val, meta]) => (
        <option key={val} value={val}>{meta.label}</option>
      ))}
    </select>
  )
}
