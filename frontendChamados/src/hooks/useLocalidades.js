import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { localidadesApi } from '../api/localidades'
import { agrupaUnidadesPorEndereco } from '../pages/unidades/adapters'
import { montaSecretariasConsolidadas } from '../pages/secretarias/adapters'

// Unidades já agrupadas por endereço (shape dos componentes do mapa).
export function useEnderecosComUnidades(filtros = {}) {
  return useQuery({
    queryKey: ['unidades', filtros],
    queryFn: () => localidadesApi.unidades(filtros),
    select: agrupaUnidadesPorEndereco,
    staleTime: 5 * 60_000,
  })
}

export function useSecretarias() {
  return useQuery({
    queryKey: ['secretarias'],
    queryFn: () => localidadesApi.secretarias(),
    staleTime: 10 * 60_000,
  })
}

// Árvore Secretaria → Divisões → Unidades (cruza os 3 endpoints).
export function useSecretariasArvore() {
  return useQuery({
    queryKey: ['secretarias-arvore'],
    queryFn: async () => {
      const [secretarias, divisoes, unidades] = await Promise.all([
        localidadesApi.secretarias(),
        localidadesApi.divisoes(),
        localidadesApi.unidades(),
      ])
      return montaSecretariasConsolidadas(secretarias, divisoes, unidades)
    },
    staleTime: 5 * 60_000,
  })
}

export function useBairros() {
  return useQuery({
    queryKey: ['bairros'],
    queryFn: () => localidadesApi.bairros(),
    staleTime: 10 * 60_000,
  })
}

// Divisões (com secretaria aninhada) - pro select de "solicitar setor".
export function useDivisoesLista() {
  return useQuery({
    queryKey: ['divisoes-lista'],
    queryFn: () => localidadesApi.divisoes(),
    staleTime: 10 * 60_000,
  })
}

// Lista crua de unidades (sem agrupamento por endereço). Aceita ?divisao, ?secretaria…
export function useUnidadesLista(filtros = {}) {
  return useQuery({
    queryKey: ['unidades-lista', filtros],
    queryFn: () => localidadesApi.unidades(filtros),
    staleTime: 5 * 60_000,
  })
}

// Prédios com planta interna (Paço etc).
export function usePredios() {
  return useQuery({
    queryKey: ['predios'],
    queryFn: () => localidadesApi.predios(),
    staleTime: 5 * 60_000,
  })
}

// Invalida o que depende de endereço/unidade após uma mutação
function useInvalidarLocalidades() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['unidades'] })
    qc.invalidateQueries({ queryKey: ['enderecos'] })
  }
}

export function useCriarEndereco() {
  const invalidar = useInvalidarLocalidades()
  return useMutation({
    mutationFn: (body) => localidadesApi.criarEndereco(body),
    onSuccess: invalidar,
  })
}

export function useEditarEndereco() {
  const invalidar = useInvalidarLocalidades()
  return useMutation({
    mutationFn: ({ id, ...body }) => localidadesApi.editarEndereco(id, body),
    onSuccess: invalidar,
  })
}

export function useExcluirEndereco() {
  const invalidar = useInvalidarLocalidades()
  return useMutation({
    mutationFn: (id) => localidadesApi.excluirEndereco(id),
    onSuccess: invalidar,
  })
}
