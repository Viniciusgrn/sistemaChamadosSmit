import { useRef, useState } from 'react'
import { Car, AlertCircle, ArrowRight, Clock } from 'lucide-react'
import Popover from '../../components/Popover'
import Slot from './Slot'
import { nomeEquipe } from './data'
import { useChamadosDIT } from '../../hooks/useChamados'
import { useVeiculos } from '../../hooks/useVeiculos'

const C = {
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  border:    '#e3e2df',
  divider:   '#ececea',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

const URGENCIA_META = {
  0: { label: 'Baixa',    cor: '#16a34a' },
  1: { label: 'Média',    cor: '#ca8a04' },
  2: { label: 'Alta',     cor: '#ea580c' },
  3: { label: 'Crítica',  cor: '#dc2626' },
}

 

export default function LobbyCard({ lobby, livres = [], onEntrar, onSair, onSairCampo, onIrParaChamados, onTrocarCarro, onDesfazer }) {
  const [escolhendoSlot, setEscolhendoSlot] = useState(null)
  const [escolhendoChamado, setEscolhendoChamado] = useState(false)
  const [escolhendoCarro, setEscolhendoCarro] = useState(false)
  // botão que abriu o popover da vez (só um fica aberto por card)
  const anchorRef = useRef(null)
  const abrir = (setter, valor) => (e) => {
    anchorRef.current = e.currentTarget
    setter(valor)
  }

  const { veiculo, chamado, tecnicos = [] } = lobby
  // Com carro, os assentos limitam a equipe. Sem carro (atendimento interno,
  // no próprio prédio) não há limite: quem já entrou + um slot pra somar.
  const totalSlots = veiculo?.assentos ?? 0
  const slotsExibidos = totalSlots > 0
    ? Array.from({ length: totalSlots }).map((_, i) => tecnicos[i] || null)
    : [...tecnicos, null]
  const comecoDaEquipe = lobby.criado_em || '--'
  // pra ir a campo basta ter gente; o chamado é escolhido na hora de despachar
  const podeSair = tecnicos.length >= 1

  return (
    <li
      className="rounded-xl overflow-hidden animate-slide-in"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 2px rgba(20,22,36,0.04)',
        backgroundImage: 'linear-gradient(180deg, #fdfcfa 0%, #ffffff 56px)',
      }}
    >

      <div
        className="px-6 pt-5 pb-3 flex items-start justify-between gap-4"
      >
        <div className="flex flex-col gap-2 min-w-0 flex-1">

          <button
            onClick={abrir(setEscolhendoCarro, true)}
            className="flex items-center gap-2 text-left rounded-md px-2 py-1 -ml-2 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f2ee')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Trocar carro"
          >
            <Car className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.text2 }} />
            {veiculo ? (
              <span className="text-[12px]">
                <span className="font-mono font-semibold" style={{ color: C.text1 }}>{veiculo.placa}</span>
                <span className="mx-1.5" style={{ color: C.text3 }}>·</span>
                <span style={{ color: C.text2 }}>
                  {veiculo.marca} {veiculo.modelo} ({veiculo.assentos} lug.)
                </span>
              </span>
            ) : (
              // sem carro é escolha válida (atendimento no próprio prédio),
              // não pendência - por isso "Sem carro" e não "Escolher carro"
              <span className="text-[12px]" style={{ color: C.text3 }}>
                Sem carro
              </span>
            )}
          </button>

          <button
            type="button"
            disabled
            className="flex items-center gap-2 text-left rounded-md px-2 py-1 -ml-2"
            title="O chamado é escolhido ao mandar a equipe pro campo"
          >
            {chamado ? (
              <span className="text-[12px] flex items-center gap-1.5 min-w-0">
                <span className="font-mono font-semibold flex-shrink-0" style={{ color: C.text1 }}>
                  {chamado.codigo}
                </span>
                <span style={{ color: C.text3 }}>·</span>
                <span className="truncate" style={{ color: C.text2 }}>
                  {chamado.titulo}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider flex-shrink-0"
                  style={{
                    backgroundColor: `${URGENCIA_META[chamado.urgencia].cor}1a`,
                    color: URGENCIA_META[chamado.urgencia].cor,
                  }}
                >
                  {URGENCIA_META[chamado.urgencia].label}
                </span>
              </span>
            ) : (
              // sem chamado ainda: só o rótulo. Quando houver, o chamado ocupa
              // esta mesma linha no lugar da palavra
              <span className="text-[12px]" style={{ color: C.text3 }}>
                Chamado
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: C.text3 }}>
          <Clock className="w-3 h-3" strokeWidth={1.75} />
          desde ({comecoDaEquipe})
        </div>  
      </div>

      <div className="px-6 py-5" style={{ borderTop: `1px solid ${C.divider}` }}>
        {(
          <div className="flex items-start justify-center gap-5 flex-wrap">
            {slotsExibidos.map((t, i) => (
              <div key={i} className="relative">
                <Slot
                  tecnico={t}
                  onClick={(e) => !t && abrir(setEscolhendoSlot, i)(e)}
                />
                {/* slot preenchido: clique tira o técnico da equipe */}
                {t && (
                  <button
                    onClick={() => onSair?.(lobby, t.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[11px] leading-none flex items-center justify-center"
                    style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                    title={`Tirar ${t.primeiro_nome} da equipe`}
                  >
                    ×
                  </button>
                )}
                {/* slot vazio clicado: lista de técnicos livres */}
                {escolhendoSlot === i && !t && (
                  <ListaTecnicosLivres
                    anchorRef={anchorRef}
                    livres={livres}
                    onEscolher={(tecnicoId) => { setEscolhendoSlot(null); onEntrar?.(lobby, tecnicoId) }}
                    onFechar={() => setEscolhendoSlot(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {tecnicos.length > 0 && (
          <div className="text-[11px] text-center mt-3" style={{ color: C.text2 }}>
            <span className="font-semibold" style={{ color: C.text1 }}>
              {nomeEquipe(tecnicos)}
            </span>
            {' · '}
            <span style={{ color: C.text3 }}>
              {/* sem carro não há teto de integrantes */}
              {totalSlots > 0 ? `${tecnicos.length}/${totalSlots}` : tecnicos.length}
              {' '}
              {tecnicos.length === 1 ? 'integrante' : 'integrantes'}
              {totalSlots === 0 && ' · interno'}
            </span>
          </div>
        )}
      </div>

      <div
        className="px-6 py-3 flex items-center justify-end gap-2"
        style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.divider}` }}
      >
        {/* Lobby sem ninguém não vira equipe: permite desfazer em vez de virar fantasma */}
        {onDesfazer && tecnicos.length === 0 && (
          <button
            onClick={() => onDesfazer(lobby)}
            className="mr-auto px-3 py-1.5 rounded-md text-[12px] transition-colors"
            style={{ color: '#b91c1c' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Desfazer equipe
          </button>
        )}

        <button
          onClick={(e) => {
            if (!podeSair) return
            // na tela de campo o chamado se escolhe na aba Chamados (busca,
            // mapa e confirmação de troca); aqui o botão só leva até lá
            if (onIrParaChamados) return onIrParaChamados(lobby)
            abrir(setEscolhendoChamado, true)(e)
          }}
          disabled={!podeSair}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: podeSair ? C.accent : '#d4d3cf',
            color: '#fff',
            cursor: podeSair ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => { if (podeSair) e.currentTarget.style.backgroundColor = C.accentInk }}
          onMouseLeave={(e) => { if (podeSair) e.currentTarget.style.backgroundColor = C.accent }}
          title={
            !podeSair ? 'A equipe precisa de ao menos 1 integrante'
              : onIrParaChamados ? 'Ver os chamados abertos e escolher o atendimento'
              : 'Escolher o chamado e despachar'
          }
        >
          Sair pra campo
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>

      {/* Popovers ficam fora do fluxo do card: ele tem overflow-hidden e
          cortaria qualquer menu posicionado por dentro. */}
      {escolhendoCarro && (
        <EscolherVeiculo
          anchorRef={anchorRef}
          onEscolher={(veiculoId) => { setEscolhendoCarro(false); onTrocarCarro?.(lobby, veiculoId) }}
          onFechar={() => setEscolhendoCarro(false)}
        />
      )}
      {escolhendoChamado && (
        <EscolherChamado
          anchorRef={anchorRef}
          onEscolher={(chamadoId) => { setEscolhendoChamado(false); onSairCampo?.(lobby, chamadoId) }}
          onFechar={() => setEscolhendoChamado(false)}
        />
      )}
    </li>
  )
}

// Popover: escolhe qual técnico livre ocupa o assento
function ListaTecnicosLivres({ anchorRef, livres, onEscolher, onFechar }) {
  return (
    <Popover anchorRef={anchorRef} onFechar={onFechar} largura={224} alturaMax={224}>
      <ul className="list-none p-1 m-0">
        {livres.length === 0 ? (
          <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>
            Nenhum técnico livre no momento.
          </li>
        ) : (
          livres.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => onEscolher(t.id)}
                className="w-full text-left px-3 py-2 rounded text-[12px] transition-colors flex items-center gap-2"
                style={{ color: C.text1 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surface2)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span
                  className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: t.cor || C.accent }}
                >
                  {(t.nome_completo || '').split(' ').slice(0, 2).map((p) => p[0]).join('')}
                </span>
                <span className="truncate">{t.nome_completo}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </Popover>
  )
}

// Popover: escolhe o chamado que a equipe vai atender
function EscolherChamado({ anchorRef, onEscolher, onFechar }) {
  const { data: chamados = [] } = useChamadosDIT()
  // só o que ainda precisa de atendimento
  const atendiveis = chamados.filter(
    (c) => c.statusReal === 'aberto' || c.statusReal === 'agendado'
  )

  return (
    <Popover
      anchorRef={anchorRef} onFechar={onFechar}
      largura={320} alturaMax={256} alinhamento="direita"
    >
      <ul className="list-none p-1 m-0">
        {atendiveis.length === 0 ? (
          <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>
            Nenhum chamado aberto para atender.
          </li>
        ) : (
          atendiveis.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onEscolher(c.id)}
                className="w-full text-left px-3 py-2 rounded transition-colors"
                style={{ color: C.text1 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surface2)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold" style={{ color: C.text3 }}>
                    #{c.code}
                  </span>
                  <span className="text-[12px] truncate">{c.title}</span>
                </div>
                <div className="text-[10px] mt-0.5 truncate" style={{ color: C.text3 }}>
                  {c.address}
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </Popover>
  )
}

// Popover: escolhe o carro do lobby (define quantos assentos a equipe tem)
function EscolherVeiculo({ anchorRef, onEscolher, onFechar }) {
  const { data: veiculos = [] } = useVeiculos()
  const disponiveis = veiculos.filter((v) => v.status === 0)

  return (
    <Popover
      anchorRef={anchorRef} onFechar={onFechar}
      largura={288} alturaMax={224} alinhamento="esquerda"
    >
      <ul className="list-none p-1 m-0">
        {/* atendimento no próprio prédio não precisa de carro - e sem carro a
            equipe também deixa de ter teto de integrantes */}
        <li style={{ borderBottom: `1px solid ${C.divider}` }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEscolher(null) }}
            className="w-full text-left px-3 py-2 rounded text-[12px] transition-colors"
            style={{ color: C.text1 }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surface2)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Sem carro
            <span className="ml-1.5" style={{ color: C.text3 }}>· atendimento interno</span>
          </button>
        </li>
        {disponiveis.length === 0 ? (
          <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>
            Nenhum veículo disponível.
          </li>
        ) : (
          disponiveis.map((v) => (
            <li key={v.id}>
              <button
                onClick={(e) => { e.stopPropagation(); onEscolher(v.id) }}
                className="w-full text-left px-3 py-2 rounded text-[12px] transition-colors"
                style={{ color: C.text1 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surface2)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="font-mono font-semibold">{v.placa}</span>
                <span className="mx-1.5" style={{ color: C.text3 }}>·</span>
                {v.marca} {v.modelo}
                <span className="ml-1" style={{ color: C.text3 }}>({v.assentos} lug.)</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </Popover>
  )
}
