import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { solicitacoesApi } from '../api/solicitacoes'

// Solicitações visíveis pro papel: comum vê as próprias; chefe vê as do(s)
// setor(es) dele; DIT vê todas. Escopo decidido no backend.
export function useSolicitacoesDivisao(filtros = {}) {
  return useQuery({
    queryKey: ['solicitacoes-divisao', filtros],
    queryFn: () => solicitacoesApi.listar(filtros),
    refetchInterval: 60_000,
    staleTime: 15_000,
  })
}

function useInvalidar() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['solicitacoes-divisao'] })
    qc.invalidateQueries({ queryKey: ['sessao'] }) // aprovação muda a divisão do usuário
  }
}

export function useCriarSolicitacao() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (divisaoId) => solicitacoesApi.criar(divisaoId), onSuccess: invalidar })
}

export function useAprovarSolicitacao() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (id) => solicitacoesApi.aprovar(id), onSuccess: invalidar })
}

export function useRecusarSolicitacao() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (id) => solicitacoesApi.recusar(id), onSuccess: invalidar })
}
