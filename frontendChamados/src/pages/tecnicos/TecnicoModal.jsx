import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Wrench, Trash2, Loader2, Search } from 'lucide-react'

import { RESP_META, CARGO_META, CARGO } from './data'
import { useCriarTecnico, useEditarTecnico, useExcluirTecnico } from '../../hooks/useTecnicos'
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

// Modal criar/editar/excluir técnico. `tecnico` null = criação.
// Na criação escolhe-se o Usuario (servidor já cadastrado) que vira técnico.
export default function TecnicoModal({ tecnico, onClose }) {
  const editando = !!tecnico?.id

  const criar = useCriarTecnico()
  const editar = useEditarTecnico()
  const excluir = useExcluirTecnico()

  const [usuarioId, setUsuarioId] = useState(null)
  const [usuarioLabel, setUsuarioLabel] = useState('')
  const [resps, setResps] = useState(tecnico?.responsabilidades || [])
  const [cargo, setCargo] = useState(tecnico?.cargo ?? CARGO.TECNICO)
  const [disponivel, setDisponivel] = useState(tecnico?.disponivel ?? true)
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const podeSalvar = editando ? resps.length > 0 : (usuarioId && resps.length > 0)
  const salvando = criar.isPending || editar.isPending
  const erroMut = criar.error || editar.error || excluir.error

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleResp = (id) =>
    setResps((s) => (s.includes(id) ? s.filter((r) => r !== id) : [...s, id]))

  const submit = (e) => {
    e.preventDefault()
    if (!podeSalvar || salvando) return
    const body = { responsabilidades_ids: resps, cargo: Number(cargo), disponivel }
    const onOk = { onSuccess: onClose }
    if (editando) editar.mutate({ id: tecnico.id, ...body }, onOk)
    else criar.mutate({ ...body, usuario_id: usuarioId }, onOk)
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
            <Wrench className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {editando ? 'Editar técnico' : 'Novo técnico'}
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
          {editando ? (
            <div>
              <div className="text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>Servidor</div>
              <div className="px-3 py-2 text-[13px] rounded-md" style={{ backgroundColor: C.surface2, color: C.text1 }}>
                {tecnico.nome_completo}
                {tecnico.matricula && (
                  <span className="ml-2 font-mono text-[11px]" style={{ color: C.text3 }}>{tecnico.matricula}</span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
                Servidor<span className="ml-0.5" style={{ color: C.erro }}>*</span>
              </label>
              <BuscaUsuario
                valorId={usuarioId}
                valorLabel={usuarioLabel}
                onSelect={(u) => {
                  setUsuarioId(u?.id ?? null)
                  setUsuarioLabel(u ? (u.nome_completo || u.username) : '')
                }}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Cargo
            </label>
            <select
              value={cargo}
              onChange={(e) => setCargo(Number(e.target.value))}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            >
              {Object.entries(CARGO_META).map(([val, meta]) => (
                <option key={val} value={val}>{meta.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[11px] font-medium mb-2" style={{ color: C.text2 }}>
              Responsabilidades<span className="ml-0.5" style={{ color: C.erro }}>*</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(RESP_META).map(([id, meta]) => {
                const val = Number(id)
                const ativo = resps.includes(val)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleResp(val)}
                    className="px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                    style={
                      ativo
                        ? { backgroundColor: `${meta.cor}1a`, color: meta.cor, border: `1px solid ${meta.cor}66` }
                        : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
                    }
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={disponivel}
              onChange={(e) => setDisponivel(e.target.checked)}
              className="w-4 h-4"
              style={{ accentColor: C.accent }}
            />
            <span className="text-[13px]" style={{ color: C.text1 }}>
              Disponível para atendimento
            </span>
            <span className="text-[11px]" style={{ color: C.text3 }}>
              (desmarque para folga/férias)
            </span>
          </label>

          {erroMut && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {erroMut.status === 401 || erroMut.status === 403
                ? 'Sem permissão. Faça login no /admin e recarregue.'
                : erroMut.data?.usuario_id
                  ? 'Este servidor já está cadastrado como técnico.'
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
                <button type="button" onClick={() => excluir.mutate(tecnico.id, { onSuccess: onClose })} disabled={excluir.isPending}
                  className="px-2.5 py-1.5 rounded-md text-[12px] font-medium" style={{ backgroundColor: C.erro, color: '#fff' }}>
                  {excluir.isPending ? 'Removendo…' : 'Sim, remover'}
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
                Remover da equipe técnica
              </button>
            )
          ) : <span />}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px] transition-colors" style={{ color: C.text2 }}>
              Cancelar
            </button>
            <button type="submit" disabled={!podeSalvar || salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{ backgroundColor: (podeSalvar && !salvando) ? C.accent : '#c7c5d9', color: '#fff', cursor: (podeSalvar && !salvando) ? 'pointer' : 'not-allowed' }}>
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              {editando ? 'Salvar' : 'Cadastrar técnico'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Busca de servidor por nome/login/matrícula (só quem ainda não é técnico)
function BuscaUsuario({ valorId, valorLabel, onSelect }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)

  const { data: usuarios = [], isFetching } = useQuery({
    queryKey: ['usuarios-busca', busca],
    queryFn: () => apiFetch('/usuarios/contas/', {
      params: { busca, sem_tecnico: 1, ativos: 1 },
    }),
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
          className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto list-none p-1 m-0 rounded-md"
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
                  className="w-full text-left px-3 py-2 rounded text-[13px] transition-colors"
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
