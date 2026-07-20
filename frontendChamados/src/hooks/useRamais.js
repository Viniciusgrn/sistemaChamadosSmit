import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ramaisApi } from '../api/ramais'

export function useRamais(filtros = {}) {
  return useQuery({
    queryKey: ['ramais', filtros],
    queryFn: () => ramaisApi.listar(filtros),
    staleTime: 5 * 60_000,
  })
}

function useInvalidarRamais() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['ramais'] })
}

export function useCriarRamal() {
  const invalidar = useInvalidarRamais()
  return useMutation({ mutationFn: (body) => ramaisApi.criar(body), onSuccess: invalidar })
}

export function useEditarRamal() {
  const invalidar = useInvalidarRamais()
  return useMutation({ mutationFn: ({ id, ...body }) => ramaisApi.editar(id, body), onSuccess: invalidar })
}

export function useExcluirRamal() {
  const invalidar = useInvalidarRamais()
  return useMutation({ mutationFn: (id) => ramaisApi.excluir(id), onSuccess: invalidar })
}
