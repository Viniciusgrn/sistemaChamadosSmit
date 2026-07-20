import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chamadosApi } from '../api/chamados'

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
