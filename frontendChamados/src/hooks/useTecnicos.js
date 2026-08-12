import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tecnicosApi } from '../api/tecnicos'

// Técnicos com status derivado (em campo / em formação / disponível / folga).
// Status muda conforme equipes são formadas, então refetch curto.
export function useTecnicos(filtros = {}) {
  return useQuery({
    queryKey: ['tecnicos', filtros],
    queryFn: () => tecnicosApi.listar(filtros),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

// Histórico de atendimentos de um técnico (drawer)
export function useHistoricoTecnico(tecnicoId) {
  return useQuery({
    queryKey: ['tecnico-historico', tecnicoId],
    queryFn: () => tecnicosApi.historico(tecnicoId),
    enabled: !!tecnicoId,
    staleTime: 30_000,
  })
}

function useInvalidarTecnicos() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['tecnicos'] })
}

export function useCriarTecnico() {
  const invalidar = useInvalidarTecnicos()
  return useMutation({ mutationFn: (body) => tecnicosApi.criar(body), onSuccess: invalidar })
}

export function useEditarTecnico() {
  const invalidar = useInvalidarTecnicos()
  return useMutation({ mutationFn: ({ id, ...body }) => tecnicosApi.editar(id, body), onSuccess: invalidar })
}

export function useExcluirTecnico() {
  const invalidar = useInvalidarTecnicos()
  return useMutation({ mutationFn: (id) => tecnicosApi.excluir(id), onSuccess: invalidar })
}
