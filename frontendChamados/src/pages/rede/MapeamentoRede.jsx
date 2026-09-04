import { useMemo, useState } from 'react'
import {
  Network, Wifi, Search, Plus, Pencil, Trash2, Eye, EyeOff, Copy, Check,
  Loader2, AlertCircle, X, Building2,
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { useUnidadesLista } from '../../hooks/useLocalidades'
import { useEquipamentos } from '../../hooks/useEquipamentos'
import {
  useDispositivosRede, useRedesWifi,
  useSalvarDispositivo, useExcluirDispositivo,
  useSalvarWifi, useExcluirWifi,
} from '../../hooks/useRede'
import { mensagemErro } from '../../api/erros'

// Mapeamento de rede: o que existe na rede de cada unidade — dispositivos
// (switch, roteador, AP...) e redes Wi-Fi, com credenciais. Uma tela só,
// escolhida a unidade: é assim que a pergunta chega ("como é a rede da
// escola X?"). Área restrita: o backend recusa até leitura fora da TI.

const C = {
  bg:       '#f7f7f4',
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

const TIPOS = [
  { value: 0, label: 'Roteador' },
  { value: 1, label: 'Switch' },
  { value: 2, label: 'Access point' },
  { value: 3, label: 'Servidor' },
  { value: 4, label: 'Impressora' },
  { value: 5, label: 'Câmera/DVR' },
  { value: 6, label: 'Outro' },
]
const TIPO_LABEL = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]))

export default function MapeamentoRede() {
  const { user } = useAuth()
  // aprendiz consulta (está em campo junto), mas não edita — o backend recusa
  const podeEditar = user?.perfil !== 'aprendiz'

  const { data: unidades = [] } = useUnidadesLista()
  const [unidadeId, setUnidadeId] = useState(null)
  const unidade = unidades.find((u) => u.id === unidadeId) || null

  const { data: dispositivos = [], isLoading: carregandoDisp } = useDispositivosRede(unidadeId)
  const { data: wifis = [], isLoading: carregandoWifi } = useRedesWifi(unidadeId)

  const [editandoDisp, setEditandoDisp] = useState(undefined) // undefined=fechado, null=novo, obj=editar
  const [editandoWifi, setEditandoWifi] = useState(undefined)

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      <header
        className="flex-shrink-0 px-6 py-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <h1 className="text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
          Mapeamento de rede
        </h1>
        <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
          Dispositivos e redes Wi-Fi por unidade · acesso restrito à TI
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <BuscaUnidade unidades={unidades} selecionada={unidade} onEscolher={setUnidadeId} />

          {!unidadeId ? (
            <div
              className="text-center py-16 rounded-lg"
              style={{ backgroundColor: C.surface, border: `1px dashed ${C.border2}`, color: C.text3 }}
            >
              <Network className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <div className="text-[13px]">Escolha a unidade pra ver (ou montar) o mapa da rede dela.</div>
            </div>
          ) : (
            <>
              <Secao
                icone={Network}
                titulo="Dispositivos"
                contador={dispositivos.length}
                onNovo={podeEditar ? () => setEditandoDisp(null) : undefined}
                carregando={carregandoDisp}
                vazio="Nenhum dispositivo mapeado nesta unidade."
              >
                {dispositivos.map((d) => (
                  <CartaoDispositivo
                    key={d.id}
                    d={d}
                    onEditar={podeEditar ? () => setEditandoDisp(d) : undefined}
                  />
                ))}
              </Secao>

              <Secao
                icone={Wifi}
                titulo="Redes Wi-Fi"
                contador={wifis.length}
                onNovo={podeEditar ? () => setEditandoWifi(null) : undefined}
                carregando={carregandoWifi}
                vazio="Nenhuma rede Wi-Fi cadastrada nesta unidade."
              >
                {wifis.map((w) => (
                  <CartaoWifi
                    key={w.id}
                    w={w}
                    onEditar={podeEditar ? () => setEditandoWifi(w) : undefined}
                  />
                ))}
              </Secao>
            </>
          )}
        </div>
      </div>

      {editandoDisp !== undefined && (
        <DispositivoModal
          dispositivo={editandoDisp}
          unidadeId={unidadeId}
          onClose={() => setEditandoDisp(undefined)}
        />
      )}
      {editandoWifi !== undefined && (
        <WifiModal
          wifi={editandoWifi}
          unidadeId={unidadeId}
          dispositivos={dispositivos}
          onClose={() => setEditandoWifi(undefined)}
        />
      )}
    </div>
  )
}

// ---------- busca de unidade ----------
function BuscaUnidade({ unidades, selecionada, onEscolher }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const base = q ? unidades.filter((u) => u.nome.toLowerCase().includes(q)) : unidades
    return [...base].sort((a, b) => a.nome.localeCompare(b.nome)).slice(0, 30)
  }, [unidades, busca])

  if (selecionada) {
    return (
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg"
        style={{ backgroundColor: '#eef0ff', border: '1px solid #d4d6ff' }}
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} style={{ color: C.accentInk }} />
          <span className="text-[14px] font-medium truncate" style={{ color: C.accentInk }}>
            {selecionada.nome}
          </span>
        </span>
        <button
          type="button"
          onClick={() => { onEscolher(null); setBusca('') }}
          style={{ color: C.accentInk }}
          aria-label="Trocar unidade"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.75} style={{ color: C.text3 }} />
      <input
        type="text"
        value={busca}
        onChange={(e) => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Buscar unidade (escola, posto, setor)…"
        className="w-full pl-10 pr-3 min-h-[46px] text-[14px] rounded-lg focus:outline-none"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, color: C.text1 }}
      />
      {aberto && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto list-none p-1 m-0 rounded-md"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 8px 24px -8px rgba(20,22,36,0.18)' }}
        >
          {filtradas.length === 0 ? (
            <li className="px-3 py-2 text-[12px]" style={{ color: C.text3 }}>Nenhuma unidade encontrada.</li>
          ) : (
            filtradas.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onEscolher(u.id); setAberto(false) }}
                  className="w-full text-left px-3 py-2 rounded text-[13px] transition-colors"
                  style={{ color: C.text1 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {u.nome}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

// ---------- seções e cartões ----------
function Secao({ icone: Icone, titulo, contador, onNovo, carregando, vazio, children }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icone className="w-4 h-4" strokeWidth={1.75} style={{ color: C.text3 }} />
          <h2 className="text-[13px] font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
            {titulo}
          </h2>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}
          >
            {contador}
          </span>
        </div>
        {onNovo && (
          <button
            onClick={onNovo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium"
            style={{ backgroundColor: C.accent, color: '#fff' }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Adicionar
          </button>
        )}
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 py-6 justify-center text-[12px]" style={{ color: C.text3 }}>
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} /> Carregando…
        </div>
      ) : contador === 0 ? (
        <div
          className="text-center py-6 rounded-lg text-[12px]"
          style={{ backgroundColor: C.surface, border: `1px dashed ${C.border}`, color: C.text3 }}
        >
          {vazio}
        </div>
      ) : (
        <ul className="list-none p-0 m-0 space-y-2">{children}</ul>
      )}
    </section>
  )
}

// Senha nunca nasce visível: revela no clique e volta a esconder ao trocar de
// unidade (o componente desmonta). Copiar não exige revelar.
function CampoSenha({ valor }) {
  const [visivel, setVisivel] = useState(false)
  const [copiado, setCopiado] = useState(false)

  if (!valor) return <span className="text-[12px]" style={{ color: C.text3 }}>sem senha</span>

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch { /* clipboard bloqueado: o olhinho continua disponível */ }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[12px]" style={{ color: C.text1 }}>
        {visivel ? valor : '••••••••'}
      </span>
      <button type="button" onClick={() => setVisivel((v) => !v)} style={{ color: C.text3 }}
              aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}>
        {visivel ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />}
      </button>
      <button type="button" onClick={copiar} style={{ color: copiado ? '#16a34a' : C.text3 }} aria-label="Copiar senha">
        {copiado ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
      </button>
    </span>
  )
}

function CartaoDispositivo({ d, onEditar }) {
  return (
    <li
      className="rounded-lg px-4 py-3"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold" style={{ color: C.text1 }}>{d.nome_na_rede}</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: '#eef0ff', color: C.accentInk }}
            >
              {d.tipo_display || TIPO_LABEL[d.tipo]}
            </span>
          </div>
          <div className="text-[12px] mt-1 flex items-center gap-3 flex-wrap" style={{ color: C.text2 }}>
            {d.ip && <span className="font-mono">{d.ip}</span>}
            {d.usuario_acesso && <span>usuário: <span className="font-mono">{d.usuario_acesso}</span></span>}
            <CampoSenha valor={d.senha_acesso} />
          </div>
          {d.equipamento_nome && (
            <div className="text-[11px] mt-1" style={{ color: C.text3 }}>
              patrimônio: {d.equipamento_nome}
            </div>
          )}
          {d.observacoes && (
            <div className="text-[11px] mt-1 whitespace-pre-wrap" style={{ color: C.text3 }}>
              {d.observacoes}
            </div>
          )}
        </div>
        {onEditar && (
          <button onClick={onEditar} className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                  style={{ color: C.text3 }} aria-label="Editar dispositivo">
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </li>
  )
}

function CartaoWifi({ w, onEditar }) {
  return (
    <li
      className="rounded-lg px-4 py-3"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold" style={{ color: C.text1 }}>{w.ssid}</span>
            {w.oculta && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#f1f1ef', color: C.text2 }}>
                oculta
              </span>
            )}
            {w.visitantes && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#fff7e6', color: '#b45309' }}>
                visitantes
              </span>
            )}
          </div>
          <div className="text-[12px] mt-1 flex items-center gap-3 flex-wrap" style={{ color: C.text2 }}>
            <CampoSenha valor={w.senha} />
            {w.emitida_por_nome && <span style={{ color: C.text3 }}>emitida por {w.emitida_por_nome}</span>}
          </div>
          {w.observacoes && (
            <div className="text-[11px] mt-1 whitespace-pre-wrap" style={{ color: C.text3 }}>
              {w.observacoes}
            </div>
          )}
        </div>
        {onEditar && (
          <button onClick={onEditar} className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                  style={{ color: C.text3 }} aria-label="Editar rede">
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </li>
  )
}

// ---------- modais ----------
function ModalBase({ titulo, onClose, children, rodape }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => e.preventDefault()}
        className="w-full max-w-lg rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>{titulo}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center" style={{ color: C.text3 }} aria-label="Fechar">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          {rodape}
        </div>
      </form>
    </div>
  )
}

function Campo({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-[11px] font-medium" style={{ color: C.text2 }}>{label}</label>
        {hint && <span className="text-[10px]" style={{ color: C.text3 }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const estiloInput = {
  backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1,
}

function DispositivoModal({ dispositivo, unidadeId, onClose }) {
  const salvar = useSalvarDispositivo()
  const excluir = useExcluirDispositivo()
  const { data: equipamentos = [] } = useEquipamentos()

  const [form, setForm] = useState({
    tipo: dispositivo?.tipo ?? 6,
    nome_na_rede: dispositivo?.nome_na_rede || '',
    ip: dispositivo?.ip || '',
    usuario_acesso: dispositivo?.usuario_acesso || '',
    senha_acesso: dispositivo?.senha_acesso || '',
    equipamento: dispositivo?.equipamento || '',
    observacoes: dispositivo?.observacoes || '',
  })
  const [erro, setErro] = useState('')
  const up = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const pode = form.nome_na_rede.trim() && !salvar.isPending

  const submeter = () => {
    if (!pode) return
    setErro('')
    salvar.mutate(
      {
        id: dispositivo?.id,
        unidade: unidadeId,
        tipo: Number(form.tipo),
        nome_na_rede: form.nome_na_rede.trim(),
        ip: form.ip.trim(),
        usuario_acesso: form.usuario_acesso.trim(),
        senha_acesso: form.senha_acesso,
        equipamento: form.equipamento || null,
        observacoes: form.observacoes.trim(),
      },
      {
        onSuccess: onClose,
        onError: (e) => setErro(mensagemErro(e, 'Não foi possível salvar o dispositivo.')),
      }
    )
  }

  return (
    <ModalBase
      titulo={dispositivo ? `Editar ${dispositivo.nome_na_rede}` : 'Novo dispositivo'}
      onClose={onClose}
      rodape={
        <>
          <span>
            {dispositivo && (
              <button
                type="button"
                onClick={() => excluir.mutate(dispositivo.id, {
                  onSuccess: onClose,
                  onError: (e) => setErro(mensagemErro(e, 'Não foi possível excluir.')),
                })}
                disabled={excluir.isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px]"
                style={{ color: '#b91c1c' }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Excluir
              </button>
            )}
          </span>
          <span className="flex items-center gap-2">
            {erro && <span className="text-[12px]" style={{ color: '#b91c1c' }}>{erro}</span>}
            <button
              type="button"
              onClick={submeter}
              disabled={!pode}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ backgroundColor: pode ? C.accent : '#c7c5d9', color: '#fff' }}
            >
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </span>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Campo label="Tipo">
          <select value={form.tipo} onChange={(e) => up('tipo', e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none" style={estiloInput}>
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Campo>
        <Campo label="Nome na rede *">
          <input value={form.nome_na_rede} onChange={(e) => up('nome_na_rede', e.target.value)}
                 placeholder="Ex.: SW-ESCOLA-01" autoFocus
                 className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono" style={estiloInput} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="IP" hint="aceita porta, faixa ou 'dinâmico'">
          <input value={form.ip} onChange={(e) => up('ip', e.target.value)}
                 placeholder="192.168.0.1"
                 className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono" style={estiloInput} />
        </Campo>
        <Campo label="Usuário de acesso">
          <input value={form.usuario_acesso} onChange={(e) => up('usuario_acesso', e.target.value)}
                 placeholder="admin"
                 className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono" style={estiloInput} />
        </Campo>
      </div>

      <Campo label="Senha de acesso" hint="guardada cifrada no servidor">
        <input value={form.senha_acesso} onChange={(e) => up('senha_acesso', e.target.value)}
               type="text" autoComplete="off"
               className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono" style={estiloInput} />
      </Campo>

      <Campo label="Equipamento do patrimônio" hint="opcional — vincula ao cadastro">
        <select value={form.equipamento || ''} onChange={(e) => up('equipamento', e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none" style={estiloInput}>
          <option value="">Sem vínculo</option>
          {equipamentos.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.nome || eq.numero_de_serie || `#${eq.id}`}</option>
          ))}
        </select>
      </Campo>

      <Campo label="Observações">
        <textarea value={form.observacoes} onChange={(e) => up('observacoes', e.target.value)} rows={2}
                  placeholder="Porta do rack, VLAN, particularidades…"
                  className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-y" style={estiloInput} />
      </Campo>
    </ModalBase>
  )
}

function WifiModal({ wifi, unidadeId, dispositivos, onClose }) {
  const salvar = useSalvarWifi()
  const excluir = useExcluirWifi()

  const [form, setForm] = useState({
    ssid: wifi?.ssid || '',
    senha: wifi?.senha || '',
    emitida_por: wifi?.emitida_por || '',
    oculta: wifi?.oculta || false,
    visitantes: wifi?.visitantes || false,
    observacoes: wifi?.observacoes || '',
  })
  const [erro, setErro] = useState('')
  const up = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const pode = form.ssid.trim() && !salvar.isPending

  const submeter = () => {
    if (!pode) return
    setErro('')
    salvar.mutate(
      {
        id: wifi?.id,
        unidade: unidadeId,
        ssid: form.ssid.trim(),
        senha: form.senha,
        emitida_por: form.emitida_por || null,
        oculta: form.oculta,
        visitantes: form.visitantes,
        observacoes: form.observacoes.trim(),
      },
      {
        onSuccess: onClose,
        onError: (e) => setErro(mensagemErro(e, 'Não foi possível salvar a rede.')),
      }
    )
  }

  return (
    <ModalBase
      titulo={wifi ? `Editar ${wifi.ssid}` : 'Nova rede Wi-Fi'}
      onClose={onClose}
      rodape={
        <>
          <span>
            {wifi && (
              <button
                type="button"
                onClick={() => excluir.mutate(wifi.id, {
                  onSuccess: onClose,
                  onError: (e) => setErro(mensagemErro(e, 'Não foi possível excluir.')),
                })}
                disabled={excluir.isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px]"
                style={{ color: '#b91c1c' }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Excluir
              </button>
            )}
          </span>
          <span className="flex items-center gap-2">
            {erro && <span className="text-[12px]" style={{ color: '#b91c1c' }}>{erro}</span>}
            <button
              type="button"
              onClick={submeter}
              disabled={!pode}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ backgroundColor: pode ? C.accent : '#c7c5d9', color: '#fff' }}
            >
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </span>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Campo label="Nome da rede (SSID) *">
          <input value={form.ssid} onChange={(e) => up('ssid', e.target.value)}
                 placeholder="Ex.: PREF-ESCOLA" autoFocus
                 className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono" style={estiloInput} />
        </Campo>
        <Campo label="Senha" hint="guardada cifrada no servidor">
          <input value={form.senha} onChange={(e) => up('senha', e.target.value)}
                 type="text" autoComplete="off"
                 className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none font-mono" style={estiloInput} />
        </Campo>
      </div>

      <Campo label="Emitida por" hint="opcional — o AP/roteador desta unidade">
        <select value={form.emitida_por || ''} onChange={(e) => up('emitida_por', e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none" style={estiloInput}>
          <option value="">Não informado</option>
          {dispositivos.map((d) => (
            <option key={d.id} value={d.id}>{d.nome_na_rede} ({d.tipo_display})</option>
          ))}
        </select>
      </Campo>

      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-[13px]" style={{ color: C.text1 }}>
          <input type="checkbox" checked={form.oculta} onChange={(e) => up('oculta', e.target.checked)} />
          Rede oculta
        </label>
        <label className="flex items-center gap-2 text-[13px]" style={{ color: C.text1 }}>
          <input type="checkbox" checked={form.visitantes} onChange={(e) => up('visitantes', e.target.checked)} />
          Rede de visitantes
        </label>
      </div>

      <Campo label="Observações">
        <textarea value={form.observacoes} onChange={(e) => up('observacoes', e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-y" style={estiloInput} />
      </Campo>
    </ModalBase>
  )
}
