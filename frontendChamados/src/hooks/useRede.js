import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { redeApi } from '../api/rede'

// Sem refetchInterval: senha de switch não muda sozinha, e ficar re-baixando
// segredo em loop só aumenta a exposição à toa.
export function useDispositivosRede(unidadeId) {
  return useQuery({
    queryKey: ['rede-dispositivos', unidadeId],
    queryFn: () => redeApi.dispositivos({ unidade: unidadeId }),
    enabled: !!unidadeId,
    staleTime: 60_000,
  })
}

export function useRedesWifi(unidadeId) {
  return useQuery({
    queryKey: ['rede-wifi', unidadeId],
    queryFn: () => redeApi.wifis({ unidade: unidadeId }),
    enabled: !!unidadeId,
    staleTime: 60_000,
  })
}

function useInvalidarRede() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['rede-dispositivos'] })
    qc.invalidateQueries({ queryKey: ['rede-wifi'] })
  }
}

export function useSalvarDispositivo() {
  const invalidar = useInvalidarRede()
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      id ? redeApi.editarDispositivo(id, body) : redeApi.criarDispositivo(body),
    onSuccess: invalidar,
  })
}

export function useExcluirDispositivo() {
  const invalidar = useInvalidarRede()
  return useMutation({ mutationFn: (id) => redeApi.excluirDispositivo(id), onSuccess: invalidar })
}

export function useSalvarWifi() {
  const invalidar = useInvalidarRede()
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      id ? redeApi.editarWifi(id, body) : redeApi.criarWifi(body),
    onSuccess: invalidar,
  })
}

export function useExcluirWifi() {
  const invalidar = useInvalidarRede()
  return useMutation({ mutationFn: (id) => redeApi.excluirWifi(id), onSuccess: invalidar })
}
