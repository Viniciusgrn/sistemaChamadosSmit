import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { X, Check, MapPin, AlertCircle, Search } from 'lucide-react'
import { useSecretarias, useDivisoesLista, useUnidadesLista } from "../../hooks/useLocalidades"
import { apiFetch } from "../../api/client"

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
    unidade_id:          '',
    title:               '',
    priority:            'baixa',
    description:         '',
  })
  // servidor escolhido como solicitante (o chamado passa a ser dele)
  const [solicitante, setSolicitante] = useState(null)
  // quem pediu não tem conta no sistema (terceirizado, visitante, estagiário
  // sem login): grava só o nome, e o chamado fica no registro de quem digitou
  const [semCadastro, setSemCadastro] = useState(false)

  // Hierarquia real: Secretaria -> Divisão -> Unidade
  const { data: secretariasApi = [] } = useSecretarias()
  const { data: divisoesApi = [] } = useDivisoesLista()
  const { data: unidadesApi = [] } = useUnidadesLista()

  const secretarias = useMemo(
    () => [...secretariasApi].sort((a, b) => a.sigla.localeCompare(b.sigla)),
    [secretariasApi]
  )

  const divisoes = useMemo(() => {
    if (!form.secretaria) return []
    return divisoesApi
      .filter((d) => String(d.secretaria?.id) === String(form.secretaria))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [divisoesApi, form.secretaria])

  // unidades da divisão escolhida (uma divisão pode ter mais de uma)
  const unidades = useMemo(() => {
    if (!form.divisao) return []
    return unidadesApi
      .filter((u) => String(u.divisao?.id ?? u.divisao) === String(form.divisao))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [unidadesApi, form.divisao])

  const unidadeEscolhida = useMemo(
    () => unidades.find((u) => String(u.id) === String(form.unidade_id)) || null,
    [unidades, form.unidade_id]
  )

  // divisão com uma unidade só: já deixa marcada (o campo continua visível)
  useEffect(() => {
    if (unidades.length === 1 && !form.unidade_id) {
      setForm((s) => ({ ...s, unidade_id: String(unidades[0].id) }))
    }
  }, [unidades, form.unidade_id])

  const setor = unidadeEscolhida
    ? {
        endereco: unidadeEscolhida.endereco
          ? `${unidadeEscolhida.endereco.rua}, ${unidadeEscolhida.endereco.numero || 's/n'}`
          : '',
        latitude: unidadeEscolhida.endereco?.latitude,
        longitude: unidadeEscolhida.endereco?.longitude,
      }
    : null

  // solicitante: um servidor cadastrado OU um nome digitado (não cadastrado)
  const temSolicitante = semCadastro
    ? form.usuario_solicitante.trim().length > 0
    : !!solicitante

  const can = temSolicitante
              && form.secretaria
              && form.divisao
              && form.title.trim()
              // explicar o chamado é obrigatório: quem atende só tem esse texto
              && form.description.trim()
              && unidadeEscolhida

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
      // sem cadastro: vai só o nome, e o chamado fica no registro de quem digitou
      solicitante_id: semCadastro ? null : (solicitante?.id ?? null),
      unidade_id:  unidadeEscolhida.id,
      title:       form.title.trim(),
      priority:    form.priority,
      description: form.description.trim(),
      nome_solicitante: form.usuario_solicitante.trim(),
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
          {/* Solicitante: escolher o servidor traz o setor e o endereço dele */}
          <Campo
            label="Solicitante"
            required
            hint={semCadastro ? 'pessoa sem conta no sistema' : 'o chamado fica no nome dele'}
          >
            {semCadastro ? (
              <input
                type="text"
                value={form.usuario_solicitante}
                onChange={(e) => update('usuario_solicitante', e.target.value)}
                placeholder="Nome de quem pediu o atendimento"
                autoFocus
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              />
            ) : (
            <BuscaServidor
              selecionado={solicitante}
              onSelect={(u) => {
                setSolicitante(u)
                if (!u) return
                // herda o local do servidor; o que ele não tiver, fica manual
                const un = u.unidade ? unidadesApi.find((x) => x.id === u.unidade) : null
                const divId = un ? (un.divisao?.id ?? un.divisao) : u.divisao
                const div = divId ? divisoesApi.find((d) => d.id === divId) : null
                setForm((s) => ({
                  ...s,
                  usuario_solicitante: u.nome_completo || u.username,
                  secretaria: div?.secretaria?.id ? String(div.secretaria.id) : '',
                  divisao: divId ? String(divId) : '',
                  unidade_id: un ? String(un.id) : '',
                }))
              }}
            />
            )}

            {/* Nem todo mundo que pede tem conta: terceirizado, visitante… */}
            <button
              type="button"
              onClick={() => {
                setSemCadastro((v) => !v)
                setSolicitante(null)
                setForm((s) => ({ ...s, usuario_solicitante: '' }))
              }}
              className="mt-1.5 text-[11px] underline"
              style={{ color: C.text3 }}
            >
              {semCadastro
                ? 'Buscar servidor cadastrado'
                : 'Solicitante não é cadastrado no sistema'}
            </button>
          </Campo>

          {solicitante && !form.divisao && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-md text-[12px]"
              style={{ backgroundColor: '#fff7e6', border: '1px solid #f0dcb4', color: '#7c5c10' }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              Este servidor não tem setor cadastrado - escolha abaixo onde o chamado deve ser aberto.
            </div>
          )}

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
                  <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>
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
                onChange={(e) => { update('divisao', e.target.value); update('unidade_id', '') }}
                disabled={!form.secretaria}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: form.divisao ? C.text1 : C.text3 }}
              >
                <option value="">Selecione…</option>
                {divisoes.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </Campo>
          </div>

          {/* Unidade - só aparece quando a divisão tem mais de uma */}
          {/* Unidade é sempre escolhida numa lista: toda unidade atendida pela
              prefeitura está cadastrada (ao contrário das pessoas) */}
          <Campo
            label="Unidade"
            required
            hint={
              !form.divisao
                ? 'escolha a divisão primeiro'
                : `${unidades.length} nesta divisão`
            }
          >
            <select
              value={form.unidade_id || ''}
              onChange={(e) => update('unidade_id', e.target.value)}
              disabled={!form.divisao}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: form.unidade_id ? C.text1 : C.text3 }}
            >
              <option value="">
                {form.divisao && unidades.length === 0
                  ? 'Esta divisão não tem unidade cadastrada'
                  : 'Selecione…'}
              </option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </Campo>

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
          <Campo label="Descrição detalhada" required hint="explique o problema pra quem vai atender">
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

// Busca o servidor que está pedindo o atendimento. Escolher alguém traz o
// setor e o endereço dele; se ele não tiver setor, o formulário segue manual.
function BuscaServidor({ selecionado, onSelect }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)

  const { data: usuarios = [], isFetching } = useQuery({
    queryKey: ['usuarios-busca', busca],
    queryFn: () => apiFetch('/usuarios/contas/', { params: { busca, ativos: 1 } }),
    enabled: busca.trim().length >= 2,
    staleTime: 30_000,
  })

  if (selecionado) {
    return (
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-md"
        style={{ backgroundColor: '#eef0ff', border: '1px solid #d4d6ff', color: C.accentInk }}
      >
        <span className="truncate font-medium">
          {selecionado.nome_completo || selecionado.username}
          <span className="ml-2 font-mono text-[11px] font-normal">{selecionado.username}</span>
        </span>
        <button
          type="button"
          onClick={() => { onSelect(null); setBusca(''); setAberto(true) }}
          style={{ color: C.accentInk }}
          aria-label="Trocar solicitante"
        >
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
        autoFocus
        className="w-full pl-8 pr-3 py-2 text-[13px] rounded-md focus:outline-none"
        style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
      />
      {aberto && busca.trim().length >= 2 && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto list-none p-1 m-0 rounded-md"
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
