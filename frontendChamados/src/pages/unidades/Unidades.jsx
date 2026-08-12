import { useMemo, useState } from 'react'
import { Search, Plus, Map, Building2, Loader2, AlertCircle, List } from 'lucide-react'
import { useEhDesktop } from '../../hooks/useMediaQuery'

import MapaEnderecos from './MapaEnderecos'
import ListaEnderecos from './ListaEnderecos'
import ViewPaco from './ViewPaco'
import AbaPredios from './AbaPredios'
import EnderecoModal from './EnderecoModal'
import { useEnderecosComUnidades, useSecretarias, usePredios } from '../../hooks/useLocalidades'

const C = {
  bg:          '#f7f7f4',
  surface:     '#ffffff',
  surface2:    '#fbfaf7',
  hover:       '#f3f2ee',
  border:      '#ececea',
  border2:     '#e3e2df',
  text1:       '#15161b',
  text2:       '#5b5e68',
  text3:       '#8b8d96',
  accent:      '#4f46e5',
  accentSoft:  '#eef0ff',
  accentInk:   '#2d2783',
}

export default function Unidades() {
  const { data: todosEnderecos = [], isLoading, isError, error } = useEnderecosComUnidades()
  const { data: secretarias = [] } = useSecretarias()
  const { data: predios = [] } = usePredios()

  // endereço (id) -> prédio (id): só os endereços que têm planta interna
  const predioPorEndereco = useMemo(() => {
    const m = {}
    for (const p of predios) {
      if (p.endereco?.id != null) m[p.endereco.id] = p.id
    }
    return m
  }, [predios])

  const ehDesktop = useEhDesktop()
  const [aba, setAba] = useState('mapa')
  // No celular mapa e lista não cabem juntos (a lista sozinha tem 360px):
  // alterna entre os dois. No desktop os dois aparecem lado a lado.
  const [vistaMobile, setVistaMobile] = useState('mapa')
  const [busca, setBusca] = useState('')
  const [filtroRural, setFiltroRural] = useState('todos')
  const [filtroSecretaria, setFiltroSecretaria] = useState(null)
  const [selecionado, setSelecionado] = useState(null)
  const [drillDownId, setDrillDownId] = useState(null)
  const [editandoEndereco, setEditandoEndereco] = useState(undefined) // undefined=fechado, null=novo, obj=editar

  const enderecosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return todosEnderecos.filter((e) => {
      if (filtroRural === 'rural' && !e.bairro?.rural) return false
      if (filtroRural === 'urbano' && e.bairro?.rural) return false
      if (filtroSecretaria && !e.unidades.some((u) => u.secretaria_id === filtroSecretaria)) return false
      if (q) {
        const blob = `${e.rua} ${e.numero} ${e.bairro?.nome} ${e.ponto_referencia} ${e.unidades.map((u) => u.nome).join(' ')}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [todosEnderecos, busca, filtroRural, filtroSecretaria])

  const totalUnidades = useMemo(
    () => enderecosFiltrados.reduce((acc, e) => acc + e.unidades.length, 0),
    [enderecosFiltrados]
  )

  if (drillDownId != null) {
    return <ViewPaco predioId={drillDownId} onVoltar={() => setDrillDownId(null)} />
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      <header
        className="flex-shrink-0 px-4 sm:px-6 pt-3 sm:pt-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h1 className="text-[17px] sm:text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
              Localidades
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              {aba === 'mapa'
                ? `${enderecosFiltrados.length} endereço${enderecosFiltrados.length !== 1 ? 's' : ''} · ${totalUnidades} unidade${totalUnidades !== 1 ? 's' : ''}`
                : 'Prédios com planta interna'}
            </div>
          </div>

          {aba === 'mapa' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditandoEndereco(null)}
                className="flex items-center justify-center gap-1.5 w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-md text-[12px] font-medium transition-colors flex-shrink-0"
                style={{ backgroundColor: C.accent, color: '#fff' }}
                title="Novo endereço"
              >
                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Novo endereço</span>
              </button>
            </div>
          )}
        </div>
        {aba === 'mapa' && (
          <div className="flex items-center gap-2 flex-wrap pb-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                strokeWidth={1.75}
                style={{ color: C.text3 }}
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por rua, bairro, unidade…"
                className="w-full pl-8 pr-3 min-h-[40px] sm:min-h-0 sm:py-1.5 text-[12px] rounded-md focus:outline-none"
                style={{
                  backgroundColor: C.surface2,
                  border: `1px solid ${C.border}`,
                  color: C.text1,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>

            <ChipGroup
              value={filtroRural}
              onChange={setFiltroRural}
              options={[
                { value: 'todos',  label: 'Todos'  },
                { value: 'urbano', label: 'Urbano' },
                { value: 'rural',  label: 'Rural'  },
              ]}
            />

            <select
              value={filtroSecretaria || ''}
              onChange={(e) => setFiltroSecretaria(e.target.value ? Number(e.target.value) : null)}
              className="px-2.5 min-h-[40px] sm:min-h-0 sm:py-1.5 text-[12px] rounded-md focus:outline-none max-w-full"
              style={{
                backgroundColor: C.surface2,
                border: `1px solid ${C.border}`,
                color: C.text1,
              }}
            >
              <option value="">Todas secretarias</option>
              {secretarias.map((s) => (
                <option key={s.id} value={s.id}>{s.sigla} · {s.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <TabButton
            ativo={aba === 'mapa'}
            icon={Map}
            label="Mapa"
            onClick={() => setAba('mapa')}
          />
          <TabButton
            ativo={aba === 'predios'}
            icon={Building2}
            label="Prédios"
            onClick={() => setAba('predios')}
          />
        </div>
      </header>
      {aba === 'mapa' ? (
        isLoading ? (
          <EstadoMapa icon={Loader2} spin texto="Carregando localidades…" />
        ) : isError ? (
          <EstadoMapa
            icon={AlertCircle}
            texto={
              error?.status === 401 || error?.status === 403
                ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                : `Erro ao carregar localidades${error?.status ? ` (${error.status})` : ''}.`
            }
          />
        ) : (
          <div className="flex-1 flex overflow-hidden relative">
            {(ehDesktop || vistaMobile === 'mapa') && (
              <div className="flex-1 min-w-0">
                <MapaEnderecos
                  enderecos={enderecosFiltrados}
                  selecionado={selecionado}
                  onSelect={(e) => {
                    setSelecionado(e)
                    // no celular, tocar num pino não deve jogar pra lista:
                    // o balão já mostra o que interessa
                  }}
                  predioPorEndereco={predioPorEndereco}
                  onAbrirPlanta={(predioId) => setDrillDownId(predioId)}
                />
              </div>
            )}

            {(ehDesktop || vistaMobile === 'lista') && (
              <aside
                className="w-full lg:w-[360px] flex-shrink-0 overflow-y-auto"
                style={{ backgroundColor: C.surface, borderLeft: `1px solid ${C.border}` }}
              >
                <ListaEnderecos
                  enderecos={enderecosFiltrados}
                  selecionado={selecionado}
                  onSelect={(e) => {
                    setSelecionado(e)
                    if (!ehDesktop) setVistaMobile('mapa')   // escolheu na lista: vai pro mapa
                  }}
                  predioPorEndereco={predioPorEndereco}
                  onAbrirPlanta={(predioId) => setDrillDownId(predioId)}
                  onEditar={setEditandoEndereco}
                />
              </aside>
            )}

            {/* Alternador flutuante — só no celular, onde os dois não cabem */}
            {!ehDesktop && (
              <button
                onClick={() => setVistaMobile((v) => (v === 'mapa' ? 'lista' : 'mapa'))}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 min-h-[44px] rounded-full text-[13px] font-medium"
                style={{
                  backgroundColor: C.text1,
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(20,22,36,0.28)',
                  zIndex: 500,
                }}
              >
                {vistaMobile === 'mapa'
                  ? <><List className="w-4 h-4" strokeWidth={1.75} />Ver lista ({enderecosFiltrados.length})</>
                  : <><Map className="w-4 h-4" strokeWidth={1.75} />Ver mapa</>}
              </button>
            )}
          </div>
        )
      ) : (
        <AbaPredios onAbrir={(predioId) => setDrillDownId(predioId)} />
      )}

      {editandoEndereco !== undefined && (
        <EnderecoModal
          endereco={editandoEndereco}
          onClose={() => setEditandoEndereco(undefined)}
        />
      )}
    </div>
  )
}

function EstadoMapa({ icon: Icon, texto, spin }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: C.text3 }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px] max-w-xs text-center">{texto}</span>
    </div>
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

function ChipGroup({ value, onChange, options }) {
  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-md"
      style={{ backgroundColor: '#fbfaf7', border: '1px solid #ececea' }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
          style={
            value === opt.value
              ? { backgroundColor: '#eef0ff', color: '#2d2783' }
              : { backgroundColor: 'transparent', color: '#5b5e68' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
