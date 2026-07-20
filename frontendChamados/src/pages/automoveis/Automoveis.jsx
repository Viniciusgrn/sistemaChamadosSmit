import { useState } from 'react'
import { Plus, Info, Loader2, AlertCircle } from 'lucide-react'

import VeiculoCard from './VeiculoCard'
import AgendarEventoModal from './AgendarEventoModal'
import VeiculoModal from './VeiculoModal'
import { useVeiculos, useCriarAgendamento } from '../../hooks/useVeiculos'

const C = {
  bg:        '#f7f7f4',
  surface:   '#ffffff',
  surface2:  '#fbfaf7',
  border:    '#ececea',
  text1:     '#15161b',
  text2:     '#5b5e68',
  text3:     '#8b8d96',
  accent:    '#4f46e5',
  accentInk: '#2d2783',
}

export default function Automoveis() {
  const { data: veiculos = [], isLoading, isError, error } = useVeiculos()
  const criarAgendamento = useCriarAgendamento()
  const [agendandoVeiculo, setAgendandoVeiculo] = useState(null)
  const [editandoVeiculo, setEditandoVeiculo] = useState(undefined) // undefined=fechado, null=novo, obj=editar

  const handleSalvarAgendamento = (form) => {
    criarAgendamento.mutate(
      {
        automovel: form.automovel_id,
        data_agendamento: form.data,
        motivo: form.motivo,
        tipo_agendamento: form.tipo_agendamento || '',
      },
      { onSuccess: () => setAgendandoVeiculo(null) }
    )
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-6 py-4"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight m-0" style={{ color: C.text1 }}>
              Frota
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: C.text2 }}>
              {veiculos.length} veículo{veiculos.length !== 1 ? 's' : ''} cadastrado{veiculos.length !== 1 ? 's' : ''}
            </div>
          </div>

          <button
            onClick={() => setEditandoVeiculo(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{ backgroundColor: C.accent, color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.accent)}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Novo veículo
          </button>
        </div>

        <div className="flex items-start gap-2 text-[11px] mt-2" style={{ color: C.text3 }}>
          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <span>
            As equipes se montam no dia e escolhem o carro ao sair para campo. A agenda registra apenas eventos pontuais (lavagem, manutenção pré-marcada).
          </span>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <Estado icon={Loader2} spin texto="Carregando frota…" />
          ) : isError ? (
            <Estado
              icon={AlertCircle}
              texto={
                error?.status === 401 || error?.status === 403
                  ? 'Sem permissão. Faça login no /admin (mesmo navegador) e recarregue.'
                  : `Erro ao carregar veículos${error?.status ? ` (${error.status})` : ''}.`
              }
            />
          ) : veiculos.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg"
              style={{ backgroundColor: C.surface, border: `1px dashed ${C.border}`, color: C.text3 }}
            >
              <div className="text-[13px]">Nenhum veículo cadastrado.</div>
            </div>
          ) : (
            <ul className="list-none p-0 m-0 space-y-4">
              {veiculos.map((v) => (
                <VeiculoCard
                  key={v.id}
                  veiculo={v}
                  onEditar={() => setEditandoVeiculo(v)}
                  onAgendar={() => setAgendandoVeiculo(v)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {agendandoVeiculo && (
        <AgendarEventoModal
          veiculo={agendandoVeiculo}
          onClose={() => setAgendandoVeiculo(null)}
          onSalvar={handleSalvarAgendamento}
        />
      )}
      {editandoVeiculo !== undefined && (
        <VeiculoModal
          veiculo={editandoVeiculo}
          onClose={() => setEditandoVeiculo(undefined)}
        />
      )}
    </div>
  )
}

function Estado({ icon: Icon, texto, spin }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: '#8b8d96' }}>
      <Icon className={`w-6 h-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} />
      <span className="text-[13px] max-w-xs text-center">{texto}</span>
    </div>
  )
}
