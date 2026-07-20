import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2, CheckCircle2, User, AlertTriangle, Building2, Clock, Search, X } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../api/auth'
import { useSolicitacoesDivisao, useCriarSolicitacao } from '../../hooks/useSolicitacoes'
import { useDivisoesLista } from '../../hooks/useLocalidades'

const C = {
  bg:       '#f7f7f4',
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  border:   '#ececea',
  border2:  '#e3e2df',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  accentInk:'#2d2783',
  erro:     '#dc2626',
  ok:       '#16a34a',
}

export default function Perfil() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirma, setConfirma] = useState('')

  const trocar = useMutation({
    mutationFn: () => authApi.trocarSenha(senhaAtual, novaSenha),
    onSuccess: () => {
      qc.setQueryData(['sessao'], (s) => (s ? { ...s, precisa_trocar_senha: false } : s))
      setSenhaAtual(''); setNovaSenha(''); setConfirma('')
    },
  })

  const confereOk = novaSenha.length >= 8 && novaSenha === confirma
  const pode = senhaAtual && confereOk && !trocar.isPending

  const submit = (e) => {
    e.preventDefault()
    if (pode) trocar.mutate()
  }

  return (
    <div className="h-full w-full overflow-y-auto p-6" style={{ backgroundColor: C.bg }}>
      <div className="max-w-xl mx-auto space-y-4">

        {user?.precisa_trocar_senha && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-semibold"
            style={{ backgroundColor: '#dc2626', color: '#fff' }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            TROQUE SUA SENHA - você ainda está com a senha inicial.
          </div>
        )}

        {/* Dados do usuário */}
        <section
          className="rounded-lg p-6"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h2 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Meu perfil
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 m-0 text-[13px]">
            <Info label="Nome" valor={user?.nome_completo} />
            <Info label="Usuário" valor={user?.username} mono />
            <Info label="Matrícula" valor={user?.matricula || '-'} mono />
            <Info label="E-mail" valor={user?.email || '-'} />
            <Info
              label="Divisão"
              valor={user?.divisao ? `${user.divisao.secretaria} · ${user.divisao.nome}` : 'Não definida'}
            />
            <Info label="Acesso" valor={user?.eh_dit ? 'DIT - sistema completo' : 'Solicitante'} />
          </dl>
        </section>

        {/* Vínculo com setor (quem está sem divisão solicita aqui) */}
        {!user?.divisao && !user?.eh_dit && <MeuSetor userId={user?.id} />}

        {/* Troca de senha */}
        <form
          onSubmit={submit}
          className="rounded-lg p-6"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h2 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Trocar senha
            </h2>
          </div>

          <div className="space-y-4">
            <Campo label="Senha atual">
              <Input type="password" value={senhaAtual} onChange={setSenhaAtual} autoComplete="current-password" />
            </Campo>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Nova senha (mín. 8 caracteres)">
                <Input type="password" value={novaSenha} onChange={setNovaSenha} autoComplete="new-password" />
              </Campo>
              <Campo label="Confirmar nova senha">
                <Input type="password" value={confirma} onChange={setConfirma} autoComplete="new-password" />
              </Campo>
            </div>

            {confirma && novaSenha !== confirma && (
              <div className="text-[12px]" style={{ color: C.erro }}>As senhas não coincidem.</div>
            )}

            {trocar.isError && (
              <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
                {trocar.error?.data?.detail || 'Erro ao trocar a senha.'}
              </div>
            )}
            {trocar.isSuccess && (
              <div
                className="flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-md"
                style={{ backgroundColor: '#dcfce7', color: '#14532d' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                Senha alterada com sucesso.
              </div>
            )}

            <button
              type="submit"
              disabled={!pode}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              style={{
                backgroundColor: pode ? C.accent : '#c7c5d9',
                color: '#fff',
                cursor: pode ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => { if (pode) e.currentTarget.style.backgroundColor = C.accentInk }}
              onMouseLeave={(e) => { if (pode) e.currentTarget.style.backgroundColor = C.accent }}
            >
              {trocar.isPending && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              {trocar.isPending ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Seção "Meu setor": mostra a solicitação pendente/recusada ou o form de pedido.
function MeuSetor({ userId }) {
  const { data: solicitacoes = [] } = useSolicitacoesDivisao()
  const { data: divisoes = [] } = useDivisoesLista()
  const criar = useCriarSolicitacao()
  const [divisaoId, setDivisaoId] = useState('')

  const minhas = useMemo(
    () => solicitacoes.filter((s) => s.usuario?.id === userId),
    [solicitacoes, userId]
  )
  const pendente = minhas.find((s) => s.status === 0)
  const recusada = !pendente && minhas.find((s) => s.status === 2)

  return (
    <section
      className="rounded-lg p-6"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
        <h2 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
          Meu setor
        </h2>
      </div>

      {pendente ? (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-md text-[13px]"
          style={{ backgroundColor: '#fff7e6', border: '1px solid #f0dcb4', color: '#7c5c10' }}
        >
          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <div className="font-medium">
              Solicitação enviada: {pendente.divisao.secretaria} · {pendente.divisao.nome}
            </div>
            <div className="text-[12px] mt-0.5">
              Aguardando aprovação do chefe do setor (ou da DIT). Você poderá abrir chamados assim que for aceito.
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[12px] mt-0 mb-4" style={{ color: C.text2 }}>
            Você ainda não está vinculado a um setor - e sem setor não é possível abrir chamados.
            Selecione sua divisão e peça pro seu chefe te aceitar.
          </p>

          {recusada && (
            <div className="mb-3 text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              Sua solicitação para {recusada.divisao.secretaria} · {recusada.divisao.nome} foi recusada.
              Escolha o setor correto e envie novamente.
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
                Minha divisão
              </label>
              <BuscaDivisao
                divisoes={divisoes}
                value={divisaoId}
                onChange={setDivisaoId}
              />
            </div>
            <button
              onClick={() => divisaoId && criar.mutate(Number(divisaoId))}
              disabled={!divisaoId || criar.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium"
              style={{
                backgroundColor: divisaoId && !criar.isPending ? C.accent : '#c7c5d9',
                color: '#fff',
                cursor: divisaoId && !criar.isPending ? 'pointer' : 'not-allowed',
              }}
            >
              {criar.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              Solicitar entrada
            </button>
          </div>

          {criar.isError && (
            <div className="mt-3 text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {criar.error?.data?.detail || 'Erro ao enviar a solicitação.'}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// Combobox de divisão com busca por nome, apelido (sigla) ou secretaria.
// Ex: digitar "DIT", "resolo" ou "planejamento" encontra.
function BuscaDivisao({ divisoes, value, onChange }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)

  const semAcento = (s) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const selecionada = divisoes.find((d) => String(d.id) === String(value))

  const filtradas = useMemo(() => {
    const q = semAcento(busca.trim())
    const lista = !q
      ? divisoes
      : divisoes.filter((d) => {
          const blob = semAcento(`${d.nome} ${d.sigla || ''} ${d.secretaria?.sigla || ''} ${d.secretaria?.nome || ''}`)
          return blob.includes(q)
        })
    return [...lista]
      .sort((a, b) => (a.secretaria?.sigla || '').localeCompare(b.secretaria?.sigla || '') || a.nome.localeCompare(b.nome))
      .slice(0, 40)
  }, [divisoes, busca])

  const rotulo = (d) => `${d.nome}${d.sigla ? ` (${d.sigla})` : ''}`

  if (selecionada) {
    return (
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-md"
        style={{ backgroundColor: '#eef0ff', border: '1px solid #d4d6ff', color: C.accentInk }}
      >
        <span className="truncate font-medium">
          {selecionada.secretaria?.sigla} · {rotulo(selecionada)}
        </span>
        <button
          type="button"
          onClick={() => { onChange(''); setBusca(''); setAberto(true) }}
          className="flex-shrink-0"
          style={{ color: C.accentInk }}
          aria-label="Trocar divisão"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
        strokeWidth={1.75}
        style={{ color: C.text3 }}
      />
      <input
        type="text"
        value={busca}
        onChange={(e) => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Busque por nome ou sigla (ex: DIT, RESOLO, contabilidade…)"
        className="w-full pl-8 pr-3 py-2 text-[13px] rounded-md focus:outline-none"
        style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
      />

      {aberto && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto list-none p-1 m-0 rounded-md"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border2}`,
            boxShadow: '0 8px 24px -8px rgba(20,22,36,0.18)',
          }}
        >
          {filtradas.length === 0 ? (
            <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>
              Nenhuma divisão encontrada.
            </li>
          ) : (
            filtradas.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange(String(d.id)); setAberto(false) }}
                  className="w-full text-left px-3 py-2 rounded text-[13px] transition-colors"
                  style={{ color: C.text1 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f2ee')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="font-medium">{rotulo(d)}</span>
                  <span className="text-[11px] ml-2" style={{ color: C.text3 }}>
                    {d.secretaria?.sigla}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function Info({ label, valor, mono }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider" style={{ color: C.text3 }}>{label}</dt>
      <dd className={`m-0 mt-0.5 ${mono ? 'font-mono' : ''}`} style={{ color: C.text1 }}>{valor}</dd>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', autoComplete }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
      style={{ backgroundColor: '#fbfaf7', border: '1px solid #ececea', color: '#15161b' }}
      onFocus={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
      onBlur={(e) => (e.currentTarget.style.borderColor = '#ececea')}
    />
  )
}
