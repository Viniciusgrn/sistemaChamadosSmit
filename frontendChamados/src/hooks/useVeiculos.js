import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { veiculosApi } from '../api/veiculos'
import { adaptaVeiculo } from '../pages/automoveis/adapters'

export function useVeiculos(filtros = {}) {
  return useQuery({
    queryKey: ['veiculos', filtros],
    queryFn: () => veiculosApi.listar(filtros),
    select: (lista) => lista.map(adaptaVeiculo),
    // frota muda em tempo real (status em uso/disponível) - refetch curto
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  })
}

function useInvalidarVeiculos() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['veiculos'] })
}

export function useCriarVeiculo() {
  const invalidar = useInvalidarVeiculos()
  return useMutation({ mutationFn: (body) => veiculosApi.criar(body), onSuccess: invalidar })
}

export function useEditarVeiculo() {
  const invalidar = useInvalidarVeiculos()
  return useMutation({ mutationFn: ({ id, ...body }) => veiculosApi.editar(id, body), onSuccess: invalidar })
}

export function useExcluirVeiculo() {
  const invalidar = useInvalidarVeiculos()
  return useMutation({ mutationFn: (id) => veiculosApi.excluir(id), onSuccess: invalidar })
}

export function useCriarAgendamento() {
  const invalidar = useInvalidarVeiculos()
  return useMutation({ mutationFn: (body) => veiculosApi.criarAgendamento(body), onSuccess: invalidar })
}
