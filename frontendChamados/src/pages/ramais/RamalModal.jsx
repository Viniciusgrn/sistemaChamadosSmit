import { useEffect, useState } from 'react'
import { X, Phone, Trash2, Loader2 } from 'lucide-react'
import { useCriarRamal, useEditarRamal, useExcluirRamal } from '../../hooks/useRamais'

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

// Modal criar/editar/excluir ramal. `ramal` null = criação.
export default function RamalModal({ ramal, setores = [], onClose }) {
  const editando = !!ramal?.id

  const criar = useCriarRamal()
  const editar = useEditarRamal()
  const excluir = useExcluirRamal()

  const [form, setForm] = useState({
    numero:   ramal?.numero || '',
    setor:    ramal?.setor || '',
    ocupante: ramal?.ocupante || '',
  })
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const podeSalvar = form.numero.trim() && form.setor.trim()
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
      numero: form.numero.trim(),
      setor: form.setor.trim(),
      ocupante: form.ocupante.trim(),
    }
    const onOk = { onSuccess: onClose }
    if (editando) editar.mutate({ id: ramal.id, ...body }, onOk)
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
        className="w-full max-w-md rounded-lg overflow-hidden flex flex-col"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {editando ? 'Editar ramal' : 'Novo ramal'}
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
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Ramal" required>
              <Input value={form.numero} onChange={(v) => update('numero', v)} placeholder="1103" autoFocus />
            </Campo>
            <Campo label="Setor" required>
              <Input value={form.setor} onChange={(v) => update('setor', v.toUpperCase())} placeholder="OBRAS" list="setores-list" />
              <datalist id="setores-list">
                {setores.map((s) => <option key={s} value={s} />)}
              </datalist>
            </Campo>
          </div>

          <Campo label="Ocupante">
            <Input value={form.ocupante} onChange={(v) => update('ocupante', v)} placeholder="Nome ou função (deixe vazio se vago)" />
          </Campo>

          {erroMut && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {erroMut.status === 401 || erroMut.status === 403
                ? 'Sem permissão. Faça login no /admin e recarregue.'
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
                <button type="button" onClick={() => excluir.mutate(ramal.id, { onSuccess: onClose })} disabled={excluir.isPending}
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
              {editando ? 'Salvar' : 'Criar ramal'}
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

function Input({ value, onChange, placeholder, autoFocus, list }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      list={list}
      className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
      style={{ backgroundColor: '#fbfaf7', border: '1px solid #ececea', color: '#15161b' }}
      onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
      onBlur={(e) => (e.currentTarget.style.borderColor = '#ececea')}
    />
  )
}
