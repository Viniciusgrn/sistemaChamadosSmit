import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { manutencaoApi } from '../api/manutencao'

export function useManutencoes(filtros = {}) {
  return useQuery({
    queryKey: ['manutencoes', filtros],
    queryFn: () => manutencaoApi.listar(filtros),
    refetchInterval: 60_000,
    staleTime: 15_000,
  })
}

// Abrir/encerrar ordem mexe no status do equipamento, então invalida os dois.
function useInvalidarManutencoes() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['manutencoes'] })
    qc.invalidateQueries({ queryKey: ['equipamentos'] })
  }
}

export function useCriarManutencao() {
  const invalidar = useInvalidarManutencoes()
  return useMutation({ mutationFn: (body) => manutencaoApi.criar(body), onSuccess: invalidar })
}

export function useEditarManutencao() {
  const invalidar = useInvalidarManutencoes()
  return useMutation({ mutationFn: ({ id, ...body }) => manutencaoApi.editar(id, body), onSuccess: invalidar })
}

export function useExcluirManutencao() {
  const invalidar = useInvalidarManutencoes()
  return useMutation({ mutationFn: (id) => manutencaoApi.excluir(id), onSuccess: invalidar })
}
