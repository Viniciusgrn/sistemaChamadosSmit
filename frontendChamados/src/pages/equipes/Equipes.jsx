import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, History, UserCheck, Loader2, AlertCircle } from 'lucide-react'

import LobbyCard from './LobbyCard'
import EquipeAtivaCard from './EquipeAtivaCard'
import EquipeHistoricoCard from './EquipeHistoricoCard'
import FormarEquipeModal from './FormarEquipeModal'
import { RESP_META } from './data'
import { STATUS_META as TECNICO_STATUS_META } from '../tecnicos/data'
import { separaPorFase } from './adapters'
import {
  useEquipes, useEntrarEquipe, useSairEquipe, useDespacharEquipe, useEncerrarEquipe,
  useEditarEquipe, useExcluirEquipe,
} from '../../hooks/useEquipes'
import { useTecnicos } from '../../hooks/useTecnicos'
import { useAuth, ehPerfilCampo } from '../../contexts/AuthContext'

const C = {
  bg:        '#f7f7f4',
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  hover:     '#f3f2ee',
  border:    '#ececea',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

export default function Equipes() {
  const { user, perfil } = useAuth()
  const navigate = useNavigate()
  // Na versão de campo o chamado não é escolhido num popover: a aba Chamados
  // tem busca, mapa e a confirmação de troca de chamado. "Sair pra campo" só
  // leva o técnico até lá — quem despacha de fato é o "Ir para o chamado".
  const naTelaDeCampo = ehPerfilCampo(perfil)
  const { data: equipesApi = [], isLoading, isError, error } = useEquipes()
  const { data: tecnicos = [] } = useTecnicos()

  const entrar = useEntrarEquipe()
  const sair = useSairEquipe()
  const despachar = useDespacharEquipe()
  const encerrar = useEncerrarEquipe()
  const editar = useEditarEquipe()
  const remover = useExcluirEquipe()

  const [aba, setAba] = useState('formacao') // 'formacao' | 'historico' | 'tecnicos'
  const [formando, setFormando] = useState(false)
  const [erroAcao, setErroAcao] = useState('')

  const { lobbies, ativas, historico } = useMemo(
    () => separaPorFase(equipesApi),
    [equipesApi]
  )

  // livres = disponíveis e sem equipe aberta
  const todosLivres = useMemo(() => {
    const ocupados = new Set(
      [...lobbies, ...ativas].flatMap((e) => e.tecnicos_ids)
    )
    return tecnicos.filter((t) => t.disponivel && !ocupados.has(t.id))
  }, [tecnicos, lobbies, ativas])

  // Escalar terceiro é do despachante. Quem não coordena só se auto-atribui,
  // então a lista de escolha mostra só ele — o backend recusa o resto de todo
  // jeito (equipeTecnica/views._garante_pode_mexer_em).
  const podeEscalarOutros = !!(user?.eh_despachante || user?.eh_chefe || user?.eh_secretario || user?.is_superuser)
  const livres = useMemo(
    () => (podeEscalarOutros ? todosLivres : todosLivres.filter((t) => t.id === user?.tecnico_id)),
    [todosLivres, podeEscalarOutros, user]
  )

  // Técnico abre equipe só quando está livre; quem coordena monta lobby pros
  // outros e por isso não entra na regra.
  const minhaEquipe = useMemo(
    () => [...lobbies, ...ativas].find((e) => e.tecnicos_ids?.includes(user?.tecnico_id)),
    [lobbies, ativas, user]
  )
  const podeFormarEquipe = podeEscalarOutros || !minhaEquipe

  const comErro = (fn) => (args) =>
    fn.mutate(args, { onError: (e) => setErroAcao(e?.data?.detail || 'Não foi possível concluir a ação.') })

  const handleEntrar = (equipe, tecnicoId) => {
    setErroAcao('')
    comErro(entrar)({ id: equipe.id, tecnicoId })
  }
  const handleSair = (equipe, tecnicoId) => {
    setErroAcao('')
    comErro(sair)({ id: equipe.id, tecnicoId })
  }
  const handleSairCampo = (equipe, chamadoId) => {
    setErroAcao('')
    comErro(despachar)({ id: equipe.id, chamadoId: chamadoId ?? equipe.chamado?.id })
  }
  const handleEncerrar = (equipe, motivo) => {
    setErroAcao('')
    comErro(encerrar)({ id: equipe.id, motivo })
  }
  const handleTrocarCarro = (equipe, veiculoId) => {
    setErroAcao('')
    comErro(editar)({ id: equipe.id, automovel_utilizado: veiculoId })
  }
  const handleDesfazer = (equipe) => {
    setErroAcao('')
    comErro(remover)(equipe.id)
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-6 pt-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
              Equipes
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              {lobbies.length} em formação · {ativas.length} em campo · {todosLivres.length} técnico{todosLivres.length !== 1 ? 's' : ''} livre{todosLivres.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* técnico já alocado não abre outra equipe — o backend recusa
              (equipeTecnica/views.perform_create); aqui só evita o caminho */}
          <button
            onClick={() => setFormando(true)}
            disabled={!podeFormarEquipe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: podeFormarEquipe ? C.accent : '#d4d3cf',
              color: '#fff',
              cursor: podeFormarEquipe ? 'pointer' : 'not-allowed',
            }}
            title={podeFormarEquipe
              ? 'Abrir uma equipe'
              : `Você já está na equipe ${minhaEquipe?.id ?? ''} — saia dela antes de abrir outra.`}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Formar equipe
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3">
          <TabButton
            ativo={aba === 'formacao'}
            icon={Users}
            label="Equipes"
            onClick={() => setAba('formacao')}
          />
          <TabButton
            ativo={aba === 'historico'}
            icon={History}
            label="Histórico"
            onClick={() => setAba('historico')}
          />
          <TabButton
            ativo={aba === 'tecnicos'}
            icon={UserCheck}
            label="Técnicos"
            onClick={() => setAba('tecnicos')}
          />
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {erroAcao && (
            <div
              className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-md text-[12px]"
              style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
              {erroAcao}
            </div>
          )}

          {isLoading ? (
            <Estado icon={Loader2} spin texto="Carregando equipes…" />
          ) : isError ? (
            <Estado
              icon={AlertCircle}
              texto={
                error?.status === 401 || error?.status === 403
                  ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                  : 'Erro ao carregar equipes.'
              }
            />
          ) : (
            <>
              {aba === 'formacao' && (
                <AbaFormacao
                  lobbies={lobbies}
                  ativas={ativas}
                  livres={livres}
                  onEntrar={handleEntrar}
                  onSair={handleSair}
                  onSairCampo={handleSairCampo}
                  onIrParaChamados={naTelaDeCampo ? () => navigate('/chamados') : undefined}
                  onEncerrar={handleEncerrar}
                  onTrocarCarro={handleTrocarCarro}
                  onDesfazer={handleDesfazer}
                />
              )}
              {aba === 'historico' && <AbaHistorico historico={historico} />}
              {/* todos os técnicos, sempre: o que muda é o status de cada um */}
              {aba === 'tecnicos'  && <AbaTecnicos tecnicos={tecnicos} />}
            </>
          )}
        </div>
      </div>

      {formando && <FormarEquipeModal onClose={() => setFormando(false)} />}
    </div>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: C.text3 }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px] max-w-xs text-center">{texto}</span>
    </div>
  )
}

// ---------- Aba: Em formação (lobbies + equipes ativas) ----------
function AbaFormacao({ lobbies, ativas, livres, onEntrar, onSair, onSairCampo, onIrParaChamados, onEncerrar, onTrocarCarro, onDesfazer }) {
  return (
    <div className="space-y-8">
      <Section
        titulo="Equipes abertas"
        contador={lobbies.length}
        vazio="Nenhuma equipe se formando agora."
      >
        <ul className="list-none p-0 m-0 space-y-4">
          {lobbies.map((l) => (
            <LobbyCard
              key={l.id}
              lobby={l}
              livres={livres}
              onEntrar={onEntrar}
              onSair={onSair}
              onSairCampo={onSairCampo}
              onIrParaChamados={onIrParaChamados}
              onTrocarCarro={onTrocarCarro}
              onDesfazer={onDesfazer}
            />
          ))}
        </ul>
      </Section>

      <Section
        titulo="Em campo"
        contador={ativas.length}
        vazio="Nenhuma equipe em campo."
      >
        <ul className="list-none p-0 m-0 space-y-3">
          {ativas.map((e) => (
            <EquipeAtivaCard key={e.id} equipe={e} onEncerrar={onEncerrar} />
          ))}
        </ul>
      </Section>
    </div>
  )
}

// ---------- Aba: Histórico ----------
function AbaHistorico({ historico }) {
  return (
    <Section
      titulo="Encerradas hoje"
      contador={historico.length}
      vazio="Nenhuma equipe encerrada hoje."
    >
      <ul className="list-none p-0 m-0 space-y-3">
        {historico.map((h) => (
          <EquipeHistoricoCard key={h.id} equipe={h} />
        ))}
      </ul>
    </Section>
  )
}

// ---------- Aba: Técnicos ----------
function AbaTecnicos({ tecnicos }) {
  return (
    <ul
      className="list-none p-0 m-0 rounded-lg overflow-hidden"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      {tecnicos.map((t, i) => (
        <li
          key={t.id}
          className="px-5 py-3 flex items-center gap-3"
          style={{
            borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
          }}
        >
          <div
            className="w-9 h-9 rounded-full inline-flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0 leading-none"
            style={{ backgroundColor: t.cor }}
          >
            {t.primeiro_nome[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate" style={{ color: C.text1 }}>
              {t.nome_completo}
            </div>
            <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: C.text2 }}>
              {(t.responsabilidades || []).map((id) => {
                const meta = RESP_META[id]
                return (
                  <span
                    key={id}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
                    style={{
                      backgroundColor: `${meta.cor}1a`,
                      color: meta.cor,
                    }}
                  >
                    {meta.label}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Ninguém sai desta lista: o que muda é o selo. "Em campo" traz
              junto de quem ele está e em qual chamado (vem de `contexto`). */}
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-medium tracking-tight whitespace-nowrap"
              style={{
                backgroundColor: TECNICO_STATUS_META[t.status]?.bg || '#f3f2ee',
                color: TECNICO_STATUS_META[t.status]?.cor || C.text2,
              }}
            >
              {TECNICO_STATUS_META[t.status]?.label || '—'}
            </span>
            {t.contexto?.label && (
              <span className="text-[10px] truncate max-w-[160px]" style={{ color: C.text3 }}>
                {t.contexto.label}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------- Componentes utilitários ----------
function Section({ titulo, contador, vazio, children }) {
  const isEmpty = contador === 0
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[13px] font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
          {titulo}
        </h2>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight"
          style={{ backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}
        >
          {contador}
        </span>
      </div>
      {isEmpty ? (
        <div
          className="text-center py-8 rounded-lg text-[12px]"
          style={{ backgroundColor: C.surface, border: `1px dashed ${C.border}`, color: C.text3 }}
        >
          {vazio}
        </div>
      ) : (
        children
      )}
    </section>
  )
}

function TabButton({ ativo, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors relative"
      style={{
        color: ativo ? C.accent : C.text2,
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => { if (!ativo) e.currentTarget.style.color = C.text1 }}
      onMouseLeave={(e) => { if (!ativo) e.currentTarget.style.color = C.text2 }}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      {label}
      {ativo && (
        <span
          className="absolute left-0 right-0 -bottom-px h-0.5"
          style={{ backgroundColor: C.accent }}
        />
      )}
    </button>
  )
}
