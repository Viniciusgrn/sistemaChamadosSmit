import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipamentosApi } from '../api/equipamentos'
import { adaptaEquipamento } from '../pages/equipamentos/adapters'

export function useEquipamentos(filtros = {}) {
  return useQuery({
    queryKey: ['equipamentos', filtros],
    queryFn: () => equipamentosApi.listar(filtros),
    select: (lista) => lista.map(adaptaEquipamento),
    staleTime: 60_000,
  })
}

function useInvalidar() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['equipamentos'] })
}

export function useCriarEquipamento() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (body) => equipamentosApi.criar(body), onSuccess: invalidar })
}

export function useEditarEquipamento() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: ({ id, ...body }) => equipamentosApi.editar(id, body), onSuccess: invalidar })
}

export function useExcluirEquipamento() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (id) => equipamentosApi.excluir(id), onSuccess: invalidar })
}
