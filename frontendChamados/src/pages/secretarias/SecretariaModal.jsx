import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Building2, Trash2, Loader2, Search } from 'lucide-react'

import { useCriarSecretaria, useEditarSecretaria, useExcluirSecretaria } from '../../hooks/useLocalidades'
import { apiFetch } from '../../api/client'

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

// Modal criar/editar/excluir secretaria. `secretaria` null = criação.
export default function SecretariaModal({ secretaria, onClose }) {
  const editando = !!secretaria?.id

  const criar = useCriarSecretaria()
  const editar = useEditarSecretaria()
  const excluir = useExcluirSecretaria()

  const [form, setForm] = useState({
    nome:  secretaria?.nome || '',
    sigla: secretaria?.sigla || '',
    cor:   secretaria?.cor || '#4f46e5',
  })
  const [secretarioId, setSecretarioId] = useState(secretaria?.secretario_responsavel ?? null)
  const [secretarioNome, setSecretarioNome] = useState(secretaria?.secretario_nome || '')
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const podeSalvar = form.nome.trim() && form.sigla.trim()
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
      nome: form.nome.trim(),
      sigla: form.sigla.trim().toUpperCase(),
      cor: form.cor,
      secretario_responsavel: secretarioId,
    }
    const onOk = { onSuccess: onClose }
    if (editando) editar.mutate({ id: secretaria.id, ...body }, onOk)
    else criar.mutate(body, onOk)
  }

  const msgErro = () => {
    const d = erroMut?.data
    if (erroMut?.status === 401 || erroMut?.status === 403) return 'Sem permissão. Faça login no /admin e recarregue.'
    if (d?.detail) return d.detail
    if (d?.sigla) return `Sigla: ${d.sigla[0]}`
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
        className="w-full max-w-lg rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {editando ? 'Editar secretaria' : 'Nova secretaria'}
            </h3>
          </div>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Campo label="Nome" required>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => update('nome', e.target.value)}
              placeholder="Secretaria Municipal de…"
              autoFocus
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Sigla" required>
              <input
                type="text"
                value={form.sigla}
                onChange={(e) => update('sigla', e.target.value.toUpperCase())}
                placeholder="SMA"
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              />
            </Campo>

            <Campo label="Cor" hint="usada no mapa e nos chips">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.cor}
                  onChange={(e) => update('cor', e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer"
                  style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface2 }}
                />
                <input
                  type="text"
                  value={form.cor}
                  onChange={(e) => update('cor', e.target.value)}
                  className="flex-1 px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono"
                  style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
                />
              </div>
            </Campo>
          </div>

          <Campo
            label="Secretário responsável"
            hint="quem ocupa este cargo enxerga os chamados de toda a secretaria"
          >
            <BuscaUsuario
              valorId={secretarioId}
              valorLabel={secretarioNome}
              onSelect={(u) => {
                setSecretarioId(u?.id ?? null)
                setSecretarioNome(u ? (u.nome_completo || u.username) : '')
              }}
            />
          </Campo>

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
                <button type="button" onClick={() => excluir.mutate(secretaria.id, { onSuccess: onClose })} disabled={excluir.isPending}
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
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
              Cancelar
            </button>
            <button type="submit" disabled={!podeSalvar || salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ backgroundColor: (podeSalvar && !salvando) ? C.accent : '#c7c5d9', color: '#fff', cursor: (podeSalvar && !salvando) ? 'pointer' : 'not-allowed' }}>
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              {editando ? 'Salvar' : 'Criar secretaria'}
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
      <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
        {label}{required && <span className="ml-0.5" style={{ color: C.erro }}>*</span>}
        {hint && <span className="ml-1.5 font-normal" style={{ color: C.text3 }}>({hint})</span>}
      </label>
      {children}
    </div>
  )
}

// Busca de servidor pra vincular como secretário
function BuscaUsuario({ valorId, valorLabel, onSelect }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)

  const { data: usuarios = [], isFetching } = useQuery({
    queryKey: ['usuarios-busca', busca],
    queryFn: () => apiFetch('/usuarios/contas/', { params: { busca, ativos: 1 } }),
    enabled: busca.trim().length >= 2,
    staleTime: 30_000,
  })

  if (valorId) {
    return (
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-md"
        style={{ backgroundColor: '#eef0ff', border: '1px solid #d4d6ff', color: C.accentInk }}
      >
        <span className="truncate font-medium">{valorLabel}</span>
        <button type="button" onClick={() => { onSelect(null); setBusca(''); setAberto(true) }} style={{ color: C.accentInk }}>
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" strokeWidth={1.75} style={{ color: C.text3 }} />
      <input
        type="text"
        value={busca}
        onChange={(e) => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Busque por nome, login ou matrícula…"
        className="w-full pl-8 pr-3 py-2 text-[13px] rounded-md focus:outline-none"
        style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
      />
      {aberto && busca.trim().length >= 2 && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto list-none p-1 m-0 rounded-md"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 8px 24px -8px rgba(20,22,36,0.18)' }}
        >
          {isFetching ? (
            <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>Buscando…</li>
          ) : usuarios.length === 0 ? (
            <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>Nenhum servidor encontrado.</li>
          ) : (
            usuarios.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onSelect(u); setAberto(false) }}
                  className="w-full text-left px-3 py-2 rounded text-[13px]"
                  style={{ color: C.text1 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="font-medium">{u.nome_completo || u.username}</span>
                  <span className="text-[11px] ml-2 font-mono" style={{ color: C.text3 }}>{u.username}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
