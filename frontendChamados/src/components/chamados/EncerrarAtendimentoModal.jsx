import { useEffect, useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'

import { STATUS_META, STATUS_EDITAVEIS } from '../../pages/chamados/data'

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

// Sair de um chamado exige dizer em que status ele fica. Sair não é resolver:
// o técnico pode terminar a parte da TI e deixar o chamado em andamento porque
// uma terceirizada ainda vai atuar.
//
// `destino` preenchido = ele está trocando pra outro chamado (confirmação da
// troca); vazio = só está encerrando o atendimento atual.
export default function EncerrarAtendimentoModal({ chamadoAtual, destino, onConfirmar, onClose, salvando, erro }) {
  const [status, setStatus] = useState(chamadoAtual?.statusReal || 'em_andamento')
  const [observacoes, setObservacoes] = useState('')
  // guia pro solicitante: especificação de compra, orientação de uso…
  const [instrucoes, setInstrucoes] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const trocando = !!destino

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.45)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg overflow-hidden flex flex-col"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.28)',
        }}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {trocando ? 'Trocar de chamado' : 'Encerrar meu atendimento'}
            </h3>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              {trocando
                ? <>Você está atendendo <strong>#{chamadoAtual?.code}</strong> e vai para <strong>#{destino.code}</strong>.</>
                : <>Você está saindo do chamado <strong>#{chamadoAtual?.code}</strong>.</>}
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ color: C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {chamadoAtual?.title && (
            <div
              className="px-3 py-2 rounded-md text-[12px]"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text2 }}
            >
              <span className="font-mono font-semibold" style={{ color: C.text1 }}>#{chamadoAtual.code}</span>
              {' · '}{chamadoAtual.title}
            </div>
          )}

          <div>
            <div className="text-[11px] font-medium mb-2" style={{ color: C.text2 }}>
              Em que status esse chamado fica?
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_EDITAVEIS.map((s) => {
                const meta = STATUS_META[s]
                const ativo = status === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className="px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                    style={
                      ativo
                        ? { backgroundColor: meta.bg, color: meta.fg, border: `1px solid ${meta.dot}` }
                        : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
                    }
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-start gap-1.5 text-[11px] mt-2" style={{ color: C.text3 }}>
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              Sair não é resolver: deixe "Em andamento" se uma terceirizada ainda vai atuar.
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Relatório interno <span className="font-normal" style={{ color: C.text3 }}>(só a TI vê · opcional)</span>
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="O que foi feito, o que ficou pendente…"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Guia de instrução pro solicitante <span className="font-normal" style={{ color: C.text3 }}>(ele lê no portal · opcional)</span>
            </label>
            <textarea
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
              rows={3}
              placeholder="Ex.: comprar um switch gigabit de 24 portas, gerenciável, padrão 19&quot;…"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-none"
              style={{ backgroundColor: '#f5f8ff', border: '1px solid #c7d2fe', color: C.text1 }}
            />
          </div>

          {erro && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {erro}
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmar({ status, observacoes, instrucoes })}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
            style={{ backgroundColor: C.accent, color: '#fff' }}
          >
            {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
            {trocando ? `Ir para #${destino.code}` : 'Encerrar atendimento'}
          </button>
        </div>
      </div>
    </div>
  )
}
