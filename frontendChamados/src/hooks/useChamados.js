import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chamadosApi } from '../api/chamados'
import { adaptaChamado } from '../pages/chamados/adapters'

// Todos os chamados (visão DIT), já no shape da tabela/mapa
export function useChamadosDIT(filtros = {}) {
  return useQuery({
    queryKey: ['chamados', 'dit', filtros],
    queryFn: () => chamadosApi.listar(filtros),
    select: (lista) => lista.map(adaptaChamado),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  })
}

// Atualização pontual (status, urgência) - usada na tabela e no modal
export function useAtualizarChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => chamadosApi.atualizar(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chamados'] }),
  })
}

// Mexer em atendimento reflete em chamados, equipes e indicadores do técnico
function useInvalidarAtendimento() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['chamados'] })
    qc.invalidateQueries({ queryKey: ['equipes'] })
    qc.invalidateQueries({ queryKey: ['tecnicos'] })
  }
}

// "Ir para o chamado": técnico assume o atendimento. Cria a equipe dele se
// necessário. Ao trocar de chamado, `statusAnterior` diz como fica o anterior.
export function useAtenderChamado() {
  const invalidar = useInvalidarAtendimento()
  return useMutation({
    mutationFn: ({ id, statusAnterior, observacoes }) =>
      chamadosApi.atender(id, {
        ...(statusAnterior != null ? { status_anterior: statusAnterior } : {}),
        ...(observacoes ? { observacoes } : {}),
      }),
    onSuccess: invalidar,
  })
}

// Técnico sai do chamado; o status escolhido é o que fica pro chamado.
export function useEncerrarAtendimento() {
  const invalidar = useInvalidarAtendimento()
  return useMutation({
    mutationFn: ({ id, status, observacoes }) =>
      chamadosApi.encerrarAtendimento(id, { status, observacoes: observacoes || '' }),
    onSuccess: invalidar,
  })
}

// Chamados do usuário logado (portal do solicitante)
export function useMeusChamados() {
  return useQuery({
    queryKey: ['chamados', 'meus'],
    queryFn: () => chamadosApi.listar({ meus: 1 }),
    refetchInterval: 60_000,
    staleTime: 15_000,
  })
}

// Chamados visíveis pro papel do usuário: setor (comum), setores abaixo
// (chefe) ou secretaria inteira (secretário). Backend decide o escopo.
export function useChamadosVisiveis() {
  return useQuery({
    queryKey: ['chamados', 'visiveis'],
    queryFn: () => chamadosApi.listar({ visiveis: 1 }),
    refetchInterval: 60_000,
    staleTime: 15_000,
  })
}

export function useAbrirChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => chamadosApi.criar(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chamados'] }),
  })
}

// Cancelamento pelo solicitante (só vale enquanto o chamado está Aberto)
export function useCancelarChamado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => chamadosApi.cancelar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chamados'] }),
  })
}
