import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentosApi } from '../api/documentos'

export function useDocumentos(busca) {
  return useQuery({
    queryKey: ['documentos', busca || ''],
    queryFn: () => documentosApi.listar(busca ? { busca } : undefined),
    staleTime: 60_000,
  })
}

function useInvalidarDocumentos() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['documentos'] })
}

export function useEnviarDocumento() {
  const invalidar = useInvalidarDocumentos()
  return useMutation({ mutationFn: documentosApi.enviar, onSuccess: invalidar })
}

export function useExcluirDocumento() {
  const invalidar = useInvalidarDocumentos()
  return useMutation({ mutationFn: (id) => documentosApi.excluir(id), onSuccess: invalidar })
}
