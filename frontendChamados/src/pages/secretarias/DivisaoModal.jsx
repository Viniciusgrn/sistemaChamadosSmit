import { useEffect, useState } from 'react'
import { X, Layers, Trash2, Loader2 } from 'lucide-react'

import { useCriarDivisao, useEditarDivisao, useExcluirDivisao } from '../../hooks/useLocalidades'

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
  erro:     '#dc2626',
}

// Modal criar/editar/excluir divisão. `divisao` null = criação.
// `secretaria` é a dona (obrigatória) - vem do drawer.
export default function DivisaoModal({ divisao, secretaria, onClose }) {
  const editando = !!divisao?.id

  const criar = useCriarDivisao()
  const editar = useEditarDivisao()
  const excluir = useExcluirDivisao()

  const [nome, setNome] = useState(divisao?.nome || '')
  const [sigla, setSigla] = useState(divisao?.sigla || '')
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const podeSalvar = nome.trim() && (editando || secretaria?.id)
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
    const body = { nome: nome.trim(), sigla: sigla.trim() || null }
    const onOk = { onSuccess: onClose }
    if (editando) editar.mutate({ id: divisao.id, ...body }, onOk)
    else criar.mutate({ ...body, secretaria_id: secretaria.id }, onOk)
  }

  const msgErro = () => {
    const d = erroMut?.data
    if (erroMut?.status === 401 || erroMut?.status === 403) return 'Sem permissão. Faça login no /admin e recarregue.'
    if (d?.detail) return d.detail
    if (d?.nome) return `Nome: ${d.nome[0]}`
    return `Erro ao salvar${erroMut?.status ? ` (${erroMut.status})` : ''}.`
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
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
              <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
                {editando ? 'Editar divisão' : 'Nova divisão'}
              </h3>
            </div>
            {secretaria && (
              <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
                em {secretaria.sigla} · {secretaria.nome}
              </div>
            )}
          </div>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ color: C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Nome<span className="ml-0.5" style={{ color: C.erro }}>*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Divisão de…"
              autoFocus
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Sigla <span className="font-normal" style={{ color: C.text3 }}>(opcional - ex: DIT, DLCA)</span>
            </label>
            <input
              type="text"
              value={sigla}
              onChange={(e) => setSigla(e.target.value)}
              placeholder="DIT"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </div>

          {erroMut && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {msgErro()}
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          {editando ? (
            confirmandoExcluir ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: C.text2 }}>Confirmar?</span>
                <button type="button" onClick={() => excluir.mutate(divisao.id, { onSuccess: onClose })} disabled={excluir.isPending}
                  className="px-2.5 py-1.5 rounded-md text-[12px] font-medium" style={{ backgroundColor: C.erro, color: '#fff' }}>
                  {excluir.isPending ? 'Excluindo…' : 'Sim, excluir'}
                </button>
                <button type="button" onClick={() => setConfirmandoExcluir(false)} className="px-2.5 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmandoExcluir(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px]" style={{ color: C.erro }}>
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Excluir
              </button>
            )
          ) : <span />}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
              Cancelar
            </button>
            <button type="submit" disabled={!podeSalvar || salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ backgroundColor: (podeSalvar && !salvando) ? C.accent : '#c7c5d9', color: '#fff', cursor: (podeSalvar && !salvando) ? 'pointer' : 'not-allowed' }}>
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              {editando ? 'Salvar' : 'Criar divisão'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
