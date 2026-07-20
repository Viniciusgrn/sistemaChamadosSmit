import { useEffect, useState } from 'react'
import { X, MapPin, Trash2, Loader2 } from 'lucide-react'
import { useBairros, useCriarEndereco, useEditarEndereco, useExcluirEndereco } from '../../hooks/useLocalidades'

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

// Modal de criar/editar Endereço. `endereco` null = criação.
export default function EnderecoModal({ endereco, onClose }) {
  const editando = !!endereco?.id

  const { data: bairros = [] } = useBairros()
  const criar = useCriarEndereco()
  const editar = useEditarEndereco()
  const excluir = useExcluirEndereco()

  const [form, setForm] = useState({
    rua:              endereco?.rua || '',
    numero:           endereco?.numero || '',
    cep:              endereco?.cep || '',
    ponto_referencia: endereco?.ponto_referencia || '',
    latitude:         endereco?.latitude ?? '',
    longitude:        endereco?.longitude ?? '',
    bairro_id:        endereco?.bairro?.id || '',
  })
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const podeSalvar = form.rua.trim() && form.bairro_id

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
      rua: form.rua.trim(),
      numero: form.numero.trim() || null,
      cep: form.cep.trim() || null,
      ponto_referencia: form.ponto_referencia.trim() || null,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      bairro_id: Number(form.bairro_id),
    }
    const onOk = { onSuccess: onClose }
    if (editando) editar.mutate({ id: endereco.id, ...body }, onOk)
    else criar.mutate(body, onOk)
  }

  const confirmarExclusao = () => {
    excluir.mutate(endereco.id, { onSuccess: onClose })
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
        <div
          className="px-5 py-4 flex items-start justify-between gap-3"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {editando ? 'Editar endereço' : 'Novo endereço'}
            </h3>
          </div>
          <button
            type="button"
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Campo label="Rua" required>
            <Input value={form.rua} onChange={(v) => update('rua', v)} placeholder="Ex.: Praça Raul Leme" autoFocus />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Número">
              <Input value={form.numero} onChange={(v) => update('numero', v)} placeholder="s/n" />
            </Campo>
            <Campo label="CEP">
              <Input value={form.cep} onChange={(v) => update('cep', v)} placeholder="00000-000" />
            </Campo>
          </div>

          <Campo label="Bairro" required>
            <select
              value={form.bairro_id}
              onChange={(e) => update('bairro_id', e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: form.bairro_id ? C.text1 : C.text3 }}
            >
              <option value="">Selecione…</option>
              {bairros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}{b.rural ? ' (rural)' : ''}</option>
              ))}
            </select>
          </Campo>

          <Campo label="Ponto de referência">
            <Input value={form.ponto_referencia} onChange={(v) => update('ponto_referencia', v)} placeholder="Opcional" />
          </Campo>

          <Campo label="Coordenadas" hint="Cole do Google Maps (lat, long). Opcional.">
            <div className="grid grid-cols-2 gap-4">
              <Input value={form.latitude} onChange={(v) => update('latitude', v)} placeholder="-22.9519" />
              <Input value={form.longitude} onChange={(v) => update('longitude', v)} placeholder="-46.5419" />
            </div>
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
        <div
          className="px-5 py-3 flex items-center justify-between gap-2"
          style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}
        >
          {editando ? (
            confirmandoExcluir ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: C.text2 }}>Confirmar?</span>
                <button
                  type="button"
                  onClick={confirmarExclusao}
                  disabled={excluir.isPending}
                  className="px-2.5 py-1.5 rounded-md text-[12px] font-medium"
                  style={{ backgroundColor: C.erro, color: '#fff' }}
                >
                  {excluir.isPending ? 'Excluindo…' : 'Sim, excluir'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoExcluir(false)}
                  className="px-2.5 py-1.5 rounded-md text-[12px]"
                  style={{ color: C.text2 }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoExcluir(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] transition-colors"
                style={{ color: C.erro }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Excluir
              </button>
            )
          ) : <span />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-[12px] transition-colors"
              style={{ color: C.text2 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.hover; e.currentTarget.style.color = C.text1 }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text2 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeSalvar || salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: (podeSalvar && !salvando) ? C.accent : '#c7c5d9',
                color: '#fff',
                cursor: (podeSalvar && !salvando) ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => { if (podeSalvar && !salvando) e.currentTarget.style.backgroundColor = C.accentInk }}
              onMouseLeave={(e) => { if (podeSalvar && !salvando) e.currentTarget.style.backgroundColor = C.accent }}
            >
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              {editando ? 'Salvar' : 'Criar endereço'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Campo({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-[11px] font-medium" style={{ color: C.text2 }}>
          {label}
          {required && <span className="ml-0.5" style={{ color: C.erro }}>*</span>}
        </label>
        {hint && <span className="text-[10px]" style={{ color: C.text3 }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, autoFocus }) {
  return (
    <input
      type="text"
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
