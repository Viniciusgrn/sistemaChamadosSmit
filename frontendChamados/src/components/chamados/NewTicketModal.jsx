import { useEffect, useMemo, useState } from "react"
import { X, Check, MapPin, AlertCircle } from 'lucide-react'
import {
  getSecretariasUnicas,
  getDivisoesPorSecretaria,
  getSetor,
} from "../../pages/chamados/data"

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
}

export default function NewTicketModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    usuario_solicitante: '',
    secretaria:          '',
    divisao:             '',
    title:               '',
    priority:            'media',
    description:         '',
  })

  const secretarias = useMemo(() => getSecretariasUnicas(), [])
  const divisoes = useMemo(
    () => getDivisoesPorSecretaria(form.secretaria),
    [form.secretaria]
  )

  // Endereço derivado da combinação secretaria+divisão (vem do banco)
  const setor = useMemo(
    () => getSetor(form.secretaria, form.divisao),
    [form.secretaria, form.divisao]
  )

  const can = form.usuario_solicitante.trim()
              && form.secretaria
              && form.divisao
              && form.title.trim()
              && setor

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    if (!can) return
    onCreate({
      usuario_solicitante: form.usuario_solicitante.trim(),
      secretaria: form.secretaria,
      divisao:    form.divisao,
      client:     `${form.secretaria} - ${form.divisao}`,   // formato legado usado na tabela
      address:    setor.endereco,
      latitude:   setor.latitude,
      longitude:  setor.longitude,
      title:      form.title.trim(),
      priority:   form.priority,
      description: form.description.trim(),
    })
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
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
          <div>
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Novo chamado
            </h3>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              Abra uma ordem de serviço para atendimento em campo.
            </div>
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
          {/* Solicitante */}
          <Campo label="Usuário solicitante" required>
            <input
              type="text"
              value={form.usuario_solicitante}
              onChange={(e) => update('usuario_solicitante', e.target.value)}
              placeholder="Quem está abrindo o chamado"
              autoFocus
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </Campo>

          {/* Secretaria + Divisão (cascata) */}
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Secretaria" required>
              <select
                value={form.secretaria}
                onChange={(e) => setForm((s) => ({ ...s, secretaria: e.target.value, divisao: '' }))}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: form.secretaria ? C.text1 : C.text3 }}
              >
                <option value="">Selecione…</option>
                {secretarias.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Campo>

            <Campo
              label="Divisão"
              required
              hint={form.secretaria ? `${divisoes.length} disponível(is)` : 'Escolha a secretaria primeiro'}
            >
              <select
                value={form.divisao}
                onChange={(e) => update('divisao', e.target.value)}
                disabled={!form.secretaria}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: form.divisao ? C.text1 : C.text3 }}
              >
                <option value="">Selecione…</option>
                {divisoes.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Campo>
          </div>

          {/* Endereço - derivado, read-only */}
          <Campo label="Endereço">
            {setor ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md"
                style={{ backgroundColor: '#eef0ff', border: '1px solid #c7d2fe' }}
              >
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: '#2d2783' }} />
                <span className="text-[13px] font-medium" style={{ color: '#2d2783' }}>
                  {setor.endereco}
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md"
                style={{ backgroundColor: C.surface2, border: `1px dashed ${C.border}` }}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text3 }} />
                <span className="text-[12px] italic" style={{ color: C.text3 }}>
                  Será preenchido automaticamente ao escolher secretaria e divisão.
                </span>
              </div>
            )}
          </Campo>

          {/* Título */}
          <Campo label="Título / descrição curta" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Ex.: Quadro de energia desarmando"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </Campo>

          {/* Prioridade */}
          <Campo label="Prioridade">
            <select
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            >
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </Campo>

          {/* Descrição */}
          <Campo label="Descrição detalhada (opcional)">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Contexto adicional, equipamentos, sintomas…"
              rows={4}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-y"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </Campo>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-end gap-2"
          style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}
        >
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
            disabled={!can}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: can ? C.accent : '#c7c5d9',
              color: '#fff',
              cursor: can ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => { if (can) e.currentTarget.style.backgroundColor = C.accentInk }}
            onMouseLeave={(e) => { if (can) e.currentTarget.style.backgroundColor = C.accent }}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            Criar chamado
          </button>
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
          {required && <span className="ml-0.5" style={{ color: '#dc2626' }}>*</span>}
        </label>
        {hint && <span className="text-[10px]" style={{ color: C.text3 }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}
