import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { terceirizadasApi } from '../api/terceirizadas'
import { adaptaEmpresa } from '../pages/terceirizadas/adapters'

export function useEmpresas(filtros = {}) {
  return useQuery({
    queryKey: ['empresas-terceirizadas', filtros],
    queryFn: () => terceirizadasApi.listar(filtros),
    select: (lista) => lista.map(adaptaEmpresa),
    staleTime: 60_000,
  })
}

function useInvalidarEmpresas() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['empresas-terceirizadas'] })
}

export function useCriarEmpresa() {
  const invalidar = useInvalidarEmpresas()
  return useMutation({ mutationFn: (body) => terceirizadasApi.criar(body), onSuccess: invalidar })
}

export function useEditarEmpresa() {
  const invalidar = useInvalidarEmpresas()
  return useMutation({ mutationFn: ({ id, ...body }) => terceirizadasApi.editar(id, body), onSuccess: invalidar })
}

export function useExcluirEmpresa() {
  const invalidar = useInvalidarEmpresas()
  return useMutation({ mutationFn: (id) => terceirizadasApi.excluir(id), onSuccess: invalidar })
}

// ===== Delegações (ChamadoTerceirizada) =====
// Mexem no chamado interno também, então invalidam as duas listas.
function useInvalidarDelegacoes() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['empresas-terceirizadas'] })
    qc.invalidateQueries({ queryKey: ['chamados'] })
  }
}

export function useDelegarChamado() {
  const invalidar = useInvalidarDelegacoes()
  return useMutation({ mutationFn: (body) => terceirizadasApi.criarChamado(body), onSuccess: invalidar })
}

export function useEditarDelegacao() {
  const invalidar = useInvalidarDelegacoes()
  return useMutation({
    mutationFn: ({ id, ...body }) => terceirizadasApi.editarChamado(id, body),
    onSuccess: invalidar,
  })
}

export function useRemoverDelegacao() {
  const invalidar = useInvalidarDelegacoes()
  return useMutation({ mutationFn: (id) => terceirizadasApi.excluirChamado(id), onSuccess: invalidar })
}
