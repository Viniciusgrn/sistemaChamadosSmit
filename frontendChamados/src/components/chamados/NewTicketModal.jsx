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
    // nasce aberto; 'agendado' exige data/hora (agendadoPara)
    situacao:            'aberto',
    agendadoPara:        '',
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

  // ---- busca em qualquer direção ----
  // As listas NÃO exigem mais o pai escolhido: buscar a divisão preenche a
  // secretaria, buscar a unidade preenche as duas. Com o pai escolhido, elas
  // afunilam como antes.
  const itensSecretaria = useMemo(() => secretarias.map((s) => ({
    id: String(s.id),
    principal: `${s.sigla} - ${s.nome}`,
    secundario: '',
    blob: `${s.sigla} ${s.nome}`.toLowerCase(),
  })), [secretarias])

  const itensDivisao = useMemo(() => {
    const base = form.secretaria
      ? divisoesApi.filter((d) => String(d.secretaria?.id) === String(form.secretaria))
      : divisoesApi
    return [...base]
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((d) => ({
        id: String(d.id),
        principal: d.nome,
        secundario: d.secretaria?.sigla || '',
        blob: `${d.nome} ${d.sigla || ''} ${d.secretaria?.sigla || ''} ${d.secretaria?.nome || ''}`.toLowerCase(),
      }))
  }, [divisoesApi, form.secretaria])

  const itensUnidade = useMemo(() => {
    let base = unidadesApi
    if (form.divisao) {
      base = base.filter((u) => String(u.divisao?.id ?? u.divisao) === String(form.divisao))
    } else if (form.secretaria) {
      const divsDaSec = new Set(
        divisoesApi
          .filter((d) => String(d.secretaria?.id) === String(form.secretaria))
          .map((d) => String(d.id))
      )
      base = base.filter((u) => divsDaSec.has(String(u.divisao?.id ?? u.divisao)))
    }
    return [...base]
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((u) => {
        const divId = u.divisao?.id ?? u.divisao
        const div = divisoesApi.find((d) => d.id === divId)
        return {
          id: String(u.id),
          principal: u.nome,
          secundario: div ? `${div.secretaria?.sigla ? div.secretaria.sigla + ' · ' : ''}${div.nome}` : '',
          blob: `${u.nome} ${div?.nome || ''} ${div?.secretaria?.sigla || ''}`.toLowerCase(),
        }
      })
  }, [unidadesApi, divisoesApi, form.secretaria, form.divisao])

  const secretariaSel = secretarias.find((s) => String(s.id) === String(form.secretaria))
  const divisaoSel = divisoesApi.find((d) => String(d.id) === String(form.divisao))

  const escolherSecretaria = (id) =>
    setForm((s) => ({ ...s, secretaria: String(id), divisao: '', unidade_id: '' }))

  const escolherDivisao = (id) => {
    const d = divisoesApi.find((x) => String(x.id) === String(id))
    setForm((s) => ({
      ...s,
      divisao: String(id),
      // caminho inverso: a divisão carrega a secretaria junto
      secretaria: d?.secretaria?.id ? String(d.secretaria.id) : s.secretaria,
      unidade_id: '',
    }))
  }

  const escolherUnidade = (id) => {
    const u = unidadesApi.find((x) => String(x.id) === String(id))
    const divId = u?.divisao?.id ?? u?.divisao
    const d = divisoesApi.find((x) => x.id === divId)
    setForm((s) => ({
      ...s,
      unidade_id: String(id),
      // caminho inverso completo: unidade carrega divisão e secretaria
      divisao: divId ? String(divId) : s.divisao,
      secretaria: d?.secretaria?.id ? String(d.secretaria.id) : s.secretaria,
    }))
  }

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
              // agendar sem data não agenda nada (o backend também recusa)
              && (form.situacao !== 'agendado' || form.agendadoPara)

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
      status:      form.situacao,
      agendadoPara: form.situacao === 'agendado' ? form.agendadoPara : null,
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
              // Nenhum chamado fica no nome de alguém da TI — inclusive de
              // quem está abrindo. O backend recusa
              // (chamado/views.perform_create); aqui a lista já explica o porquê.
              ehDaTi={(u) => {
                const un = u.unidade ? unidadesApi.find((x) => x.id === u.unidade) : null
                const divId = un ? (un.divisao?.id ?? un.divisao) : u.divisao
                const div = divId ? divisoesApi.find((d) => d.id === divId) : null
                return (div?.secretaria?.sigla || '').toUpperCase() === 'SMIT'
              }}
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

          {/* Secretaria + Divisão — busca nos DOIS sentidos: escolher a
              secretaria afunila a divisão, e buscar a divisão direto preenche
              a secretaria sozinha */}
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Secretaria" required>
              <ComboBusca
                selecionado={secretariaSel ? `${secretariaSel.sigla} - ${secretariaSel.nome}` : null}
                onLimpar={() => setForm((s) => ({ ...s, secretaria: '', divisao: '', unidade_id: '' }))}
                onEscolher={escolherSecretaria}
                itens={itensSecretaria}
                placeholder="Buscar secretaria…"
              />
            </Campo>

            <Campo
              label="Divisão"
              required
              hint={form.secretaria ? `${itensDivisao.length} na secretaria` : 'buscar preenche a secretaria'}
            >
              <ComboBusca
                selecionado={divisaoSel ? divisaoSel.nome : null}
                onLimpar={() => setForm((s) => ({ ...s, divisao: '', unidade_id: '' }))}
                onEscolher={escolherDivisao}
                itens={itensDivisao}
                placeholder="Buscar divisão…"
              />
            </Campo>
          </div>

          {/* Unidade — buscar direto preenche divisão e secretaria */}
          <Campo
            label="Unidade"
            required
            hint={form.divisao ? `${itensUnidade.length} na divisão` : 'buscar preenche divisão e secretaria'}
          >
            <ComboBusca
              selecionado={unidadeEscolhida ? unidadeEscolhida.nome : null}
              onLimpar={() => setForm((s) => ({ ...s, unidade_id: '' }))}
              onEscolher={escolherUnidade}
              itens={itensUnidade}
              placeholder="Buscar unidade (escola, posto, setor)…"
              vazio={form.divisao ? 'Esta divisão não tem unidade cadastrada.' : 'Nenhuma unidade encontrada.'}
            />
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

          {/* Aberto agora ou visita marcada */}
          <Campo label="Situação">
            <div className="flex items-center gap-2">
              <select
                value={form.situacao}
                onChange={(e) => update('situacao', e.target.value)}
                className="px-3 py-2 text-[13px] rounded-md focus:outline-none"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              >
                <option value="aberto">Aberto</option>
                <option value="agendado">Agendado</option>
              </select>
              {form.situacao === 'agendado' && (
                <input
                  type="datetime-local"
                  value={form.agendadoPara}
                  onChange={(e) => update('agendadoPara', e.target.value)}
                  className="flex-1 px-3 py-2 text-[13px] rounded-md focus:outline-none"
                  style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
                />
              )}
            </div>
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

// Caixa de busca com escolha única — mesmo desenho do BuscaServidor.
// Escolhido, vira um chip com X pra trocar; vazio, é busca com lista.
// Abre no foco mostrando os primeiros itens: dá pra usar como um select
// comum, só que filtrável.
function ComboBusca({ selecionado, onLimpar, onEscolher, itens, placeholder, vazio }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)

  const q = busca.trim().toLowerCase()
  const filtrados = (q ? itens.filter((i) => i.blob.includes(q)) : itens).slice(0, 30)

  if (selecionado) {
    return (
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-md"
        style={{ backgroundColor: '#eef0ff', border: '1px solid #d4d6ff', color: C.accentInk }}
      >
        <span className="truncate font-medium">{selecionado}</span>
        <button
          type="button"
          onClick={() => { onLimpar(); setBusca('') }}
          style={{ color: C.accentInk }}
          aria-label="Trocar"
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
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2 text-[13px] rounded-md focus:outline-none"
        style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
      />
      {aberto && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto list-none p-1 m-0 rounded-md"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 8px 24px -8px rgba(20,22,36,0.18)' }}
        >
          {filtrados.length === 0 ? (
            <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>
              {vazio || 'Nada encontrado.'}
            </li>
          ) : (
            filtrados.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onEscolher(i.id); setAberto(false); setBusca('') }}
                  className="w-full text-left px-3 py-2 rounded text-[13px] transition-colors"
                  style={{ color: C.text1 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="font-medium">{i.principal}</span>
                  {i.secundario && (
                    <span className="text-[11px] ml-2" style={{ color: C.text3 }}>{i.secundario}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

// Busca o servidor que está pedindo o atendimento. Escolher alguém traz o
// setor e o endereço dele; se ele não tiver setor, o formulário segue manual.
function BuscaServidor({ selecionado, onSelect, ehDaTi }) {
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
            usuarios.map((u) => {
              // Continua na lista, mas travado: sumir daria a impressão de que
              // a pessoa não existe. Aparecer com o motivo ensina a regra.
              const daTi = ehDaTi?.(u)
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={daTi}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { if (!daTi) { onSelect(u); setAberto(false) } }}
                    className="w-full text-left px-3 py-2 rounded text-[13px] transition-colors"
                    style={{ color: daTi ? C.text3 : C.text1, cursor: daTi ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={(e) => { if (!daTi) e.currentTarget.style.backgroundColor = C.hover }}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    title={daTi ? 'O chamado precisa ficar no nome de quem pediu o atendimento' : undefined}
                  >
                    <span className={daTi ? '' : 'font-medium'}>{u.nome_completo || u.username}</span>
                    <span className="text-[11px] ml-2 font-mono" style={{ color: C.text3 }}>{u.username}</span>
                    {daTi && (
                      <span className="block text-[10px] mt-0.5" style={{ color: '#b45309' }}>
                        equipe de TI — identifique o solicitante real
                      </span>
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
