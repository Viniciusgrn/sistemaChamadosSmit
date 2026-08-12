import { useEffect, useState } from 'react'
import { X, Users, Loader2, Car } from 'lucide-react'

import { useCriarEquipe } from '../../hooks/useEquipes'
import { useVeiculos } from '../../hooks/useVeiculos'

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

// Abre um lobby vazio. Os técnicos entram depois, pelos slots do card.
export default function FormarEquipeModal({ onClose }) {
  const criar = useCriarEquipe()
  const { data: veiculos = [] } = useVeiculos()
  const [veiculoId, setVeiculoId] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // só carros disponíveis (status 0) entram na lista
  const disponiveis = veiculos.filter((v) => v.status === 0)

  const submit = (e) => {
    e.preventDefault()
    if (criar.isPending) return
    criar.mutate(
      veiculoId ? { automovel_utilizado: Number(veiculoId) } : {},
      { onSuccess: onClose }
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
        onSubmit={submit}
        className="w-full max-w-md rounded-lg overflow-hidden flex flex-col"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              Formar equipe
            </h3>
          </div>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: C.text3 }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[12px] m-0" style={{ color: C.text2 }}>
            A equipe abre vazia: os técnicos entram pelos assentos do carro, e depois
            você escolhe o chamado e manda pro campo.
          </p>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
              Veículo
            </label>
            <select
              value={veiculoId}
              onChange={(e) => setVeiculoId(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            >
              <option value="">Definir depois</option>
              {disponiveis.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} · {v.placa} ({v.assentos} assentos)
                </option>
              ))}
            </select>
            <div className="text-[11px] mt-1.5" style={{ color: C.text3 }}>
              <Car className="w-3 h-3 inline mr-1" strokeWidth={1.75} />
              O número de assentos limita quantos técnicos cabem na equipe.
            </div>
          </div>

          {criar.isError && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {criar.error?.data?.detail || 'Erro ao criar a equipe.'}
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={criar.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
            style={{ backgroundColor: C.accent, color: '#fff' }}
          >
            {criar.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
            Abrir equipe
          </button>
        </div>
      </form>
    </div>
  )
}
