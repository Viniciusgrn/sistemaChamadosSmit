import { useMemo, useState } from 'react'
import { Plus, Users, History, UserCheck } from 'lucide-react'

import LobbyCard from './LobbyCard'
import EquipeAtivaCard from './EquipeAtivaCard'
import EquipeHistoricoCard from './EquipeHistoricoCard'
import {
  SEED_LOBBIES,
  SEED_EQUIPES_ATIVAS,
  SEED_HISTORICO_HOJE,
  SEED_TECNICOS,
  RESP_META,
  getTecnicosLivres,
  resolveTecnico,
} from './data'

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
  // TODO: trocar por useQuery quando wire na API
  const [lobbies, setLobbies] = useState(SEED_LOBBIES)
  const [ativas]              = useState(SEED_EQUIPES_ATIVAS)
  const [historico]           = useState(SEED_HISTORICO_HOJE)
  const [aba, setAba]         = useState('formacao') // 'formacao' | 'historico' | 'tecnicos'

  const livres = useMemo(() => getTecnicosLivres(), [])

  // Stub das ações - TODOs até wire na API
  const handleEntrar = (lobby) => {
    // TODO: backend determina QUEM entra baseado no usuário logado
    console.log('Entrar no lobby', lobby.id)
  }
  const handleSairCampo = (lobby) => {
    // TODO: POST /api/equipes/formacoes/ com tecnicos + veiculo + chamado
    setLobbies((s) => s.filter((l) => l.id !== lobby.id))
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
              {lobbies.length} em formação · {ativas.length} em campo · {livres.length} técnico{livres.length !== 1 ? 's' : ''} livre{livres.length !== 1 ? 's' : ''}
            </div>
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
            title="Geralmente não usado pelo despachante - equipes se montam sozinhas"
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
            label="Em formação"
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
          {aba === 'formacao' && (
            <AbaFormacao
              lobbies={lobbies}
              ativas={ativas}
              onEntrar={handleEntrar}
              onSairCampo={handleSairCampo}
            />
          )}
          {aba === 'historico' && <AbaHistorico historico={historico} />}
          {aba === 'tecnicos'  && <AbaTecnicos tecnicos={SEED_TECNICOS} />}
        </div>
      </div>
    </div>
  )
}

// ---------- Aba: Em formação (lobbies + equipes ativas) ----------
function AbaFormacao({ lobbies, ativas, onEntrar, onSairCampo }) {
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
              onEntrar={onEntrar}
              onSairCampo={onSairCampo}
            />
          ))}
        </ul>
        <ul className="list-none p-0 m-0 space-y-4">
          {lobbies.map((l) => (
            <LobbyCard
              key={l.id}
              lobby={l}
              onEntrar={onEntrar}
              onSairCampo={onSairCampo}
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
            <EquipeAtivaCard key={e.id} equipe={e} />
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

          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium tracking-tight flex-shrink-0"
            style={
              t.disponivel
                ? { backgroundColor: '#dcfce7', color: '#14532d' }
                : { backgroundColor: '#f3f2ee', color: C.text2 }
            }
          >
            {t.disponivel ? 'Disponível' : 'Folga'}
          </span>
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
