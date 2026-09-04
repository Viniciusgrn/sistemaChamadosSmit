import { useRef, useState } from 'react'
import {
  FileText, Search, Plus, Trash2, Download, Loader2, X, Upload,
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { useDocumentos, useEnviarDocumento, useExcluirDocumento } from '../../hooks/useDocumentos'
import { documentosApi } from '../../api/documentos'
import { mensagemErro } from '../../api/erros'

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
}

function formataTamanho(bytes) {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formataData(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function Documentos() {
  const { user } = useAuth()
  const podeEditar = user?.perfil !== 'aprendiz'

  // busca no cliente: a lista chega inteira e filtrar aqui responde a cada
  // tecla sem ida ao servidor (o ?busca= da API existe pra quando crescer)
  const [busca, setBusca] = useState('')
  const { data: documentos = [], isLoading } = useDocumentos()

  const q = busca.trim().toLowerCase()
  const filtrados = q ? documentos.filter((d) => d.nome.toLowerCase().includes(q)) : documentos

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      <header
        className="flex-shrink-0 px-6 py-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <h1 className="text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
          Documentos
        </h1>
        <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
          Arquivos da TI, pra baixar de onde você estiver
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.75} style={{ color: C.text3 }} />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar documento pelo nome…"
                className="w-full pl-10 pr-3 min-h-[46px] text-[14px] rounded-lg focus:outline-none"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, color: C.text1 }}
              />
            </div>
            {podeEditar && (
              <button
                onClick={() => setEnviando(true)}
                className="flex items-center gap-1.5 px-3.5 min-h-[46px] rounded-lg text-[13px] font-medium flex-shrink-0"
                style={{ backgroundColor: C.accent, color: '#fff' }}
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Enviar documento
              </button>
            )}
          </div>

          {erro && (
            <div className="px-4 py-3 rounded-lg text-[12px]" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 py-10 justify-center text-[12px]" style={{ color: C.text3 }}>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} /> Carregando…
            </div>
          ) : filtrados.length === 0 ? (
            <div
              className="text-center py-16 rounded-lg"
              style={{ backgroundColor: C.surface, border: `1px dashed ${C.border2}`, color: C.text3 }}
            >
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <div className="text-[13px]">
                {q ? 'Nenhum documento com esse nome.' : 'Nenhum documento guardado ainda.'}
              </div>
            </div>
          ) : (
            <ul className="list-none p-0 m-0 space-y-2">
              {filtrados.map((doc) => (
                <LinhaDocumento
                  key={doc.id}
                  doc={doc}
                  podeEditar={podeEditar}
                  onErro={setErro}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {enviando && <EnviarModal onClose={() => setEnviando(false)} />}
    </div>
  )
}

function LinhaDocumento({ doc, podeEditar, onErro }) {
  const excluir = useExcluirDocumento()
  const [confirmando, setConfirmando] = useState(false)
  const [baixando, setBaixando] = useState(false)

  const baixar = async () => {
    setBaixando(true)
    onErro('')
    try {
      await documentosApi.baixar(doc.id, doc.nome)
    } catch (e) {
      onErro(mensagemErro(e, `Não foi possível baixar "${doc.nome}".`))
    } finally {
      setBaixando(false)
    }
  }

  const meta = [formataData(doc.created_at), formataTamanho(doc.tamanho), doc.enviado_por]
    .filter(Boolean).join(' · ')

  return (
    <li
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#eef0ff' }}
      >
        <FileText className="w-4.5 h-4.5" strokeWidth={1.75} style={{ color: C.accent, width: 18, height: 18 }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: C.text1 }}>{doc.nome}</div>
        <div className="text-[11px] truncate" style={{ color: C.text3 }}>{meta}</div>
      </div>

      {confirmando ? (
        <span className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[12px]" style={{ color: C.text2 }}>Excluir?</span>
          <button
            onClick={() => excluir.mutate(doc.id, {
              onError: (e) => onErro(mensagemErro(e, 'Não foi possível excluir.')),
            })}
            disabled={excluir.isPending}
            className="px-2.5 py-1.5 rounded-md text-[12px] font-medium"
            style={{ backgroundColor: '#b91c1c', color: '#fff' }}
          >
            {excluir.isPending ? 'Excluindo…' : 'Excluir'}
          </button>
          <button
            onClick={() => setConfirmando(false)}
            className="px-2 py-1.5 rounded-md text-[12px]"
            style={{ color: C.text2 }}
          >
            Cancelar
          </button>
        </span>
      ) : (
        <span className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={baixar}
            disabled={baixando}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium"
            style={{ backgroundColor: '#eef0ff', color: C.accent }}
            title="Baixar PDF"
          >
            {baixando
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
              : <Download className="w-3.5 h-3.5" strokeWidth={2} />}
            Baixar
          </button>
          {podeEditar && (
            <button
              onClick={() => setConfirmando(true)}
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ color: C.text3 }}
              aria-label={`Excluir ${doc.nome}`}
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </span>
      )}
    </li>
  )
}

function EnviarModal({ onClose }) {
  const enviar = useEnviarDocumento()
  const inputArquivo = useRef(null)

  const [nome, setNome] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [erro, setErro] = useState('')

  const escolherArquivo = (f) => {
    if (!f) return
    setArquivo(f)
    // o nome do arquivo já é um bom nome de documento — preenche se estiver
    // vazio, sem a extensão
    if (!nome.trim()) setNome(f.name.replace(/\.pdf$/i, ''))
  }

  const pode = nome.trim() && arquivo && !enviar.isPending

  const submeter = () => {
    if (!pode) return
    setErro('')
    enviar.mutate(
      { nome: nome.trim(), arquivo },
      {
        onSuccess: onClose,
        onError: (e) => setErro(mensagemErro(e, 'Não foi possível enviar o documento.')),
      }
    )
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); submeter() }}
        className="w-full max-w-md rounded-lg overflow-hidden flex flex-col"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
            Enviar documento
          </h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center" style={{ color: C.text3 }} aria-label="Fechar">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Arquivo (PDF) *
            </label>
            <input
              ref={inputArquivo}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => escolherArquivo(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputArquivo.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-4 rounded-lg text-[13px]"
              style={{
                backgroundColor: arquivo ? '#eef0ff' : C.surface2,
                border: `1px dashed ${arquivo ? '#d4d6ff' : C.border2}`,
                color: arquivo ? C.accent : C.text2,
              }}
            >
              {arquivo
                ? <><FileText className="w-4 h-4" strokeWidth={1.75} /><span className="truncate">{arquivo.name}</span></>
                : <><Upload className="w-4 h-4" strokeWidth={1.75} /> Escolher o PDF…</>}
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Nome do documento *
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Termo de responsabilidade de equipamento"
              maxLength={150}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          {erro && <span className="text-[12px] mr-auto" style={{ color: '#b91c1c' }}>{erro}</span>}
          <button
            type="submit"
            disabled={!pode}
            className="px-3.5 py-1.5 rounded-md text-[12px] font-medium"
            style={{ backgroundColor: pode ? C.accent : '#c7c5d9', color: '#fff' }}
          >
            {enviar.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  )
}
