import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipesApi } from '../api/equipes'

const CORES_MEMBRO = ['#4f46e5', '#0ea5e9', '#f97316', '#10b981', '#7c3aed', '#dc2626']

function iniciais(nome) {
  return (nome || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// Adapta Equipe da API -> shape do TeamCard
export function adaptaEquipe(e) {
  const membros = (e.tecnicos_nomes || []).map((t, i) => ({
    name: t.nome,
    initials: iniciais(t.nome),
    color: CORES_MEMBRO[i % CORES_MEMBRO.length],
  }))
  const v = e.veiculo
  const c = e.chamado

  return {
    id: String(e.id),
    name: membros.map((m) => m.name.split(' ')[0]).join(' + ') || `Equipe ${e.id}`,
    members: membros,
    // ids de Tecnico: o app de campo usa pra achar "a minha equipe"
    tecnicoIds: (e.tecnicos_nomes || []).map((t) => t.id),
    // sem chamado = montada mas parada; com chamado = em atendimento
    status: c ? 'em_atendimento' : 'disponivel',
    activeTicket: c ? { code: String(c.id), title: c.titulo } : null,
    // pode não ter carro definido ainda - o card trata null
    vehicle: v ? { plate: v.placa, model: v.modelo } : null,
    // interno = unidade dentro do Paço (sem deslocamento); só faz sentido com chamado
    interno: c ? c.interno : null,
    location: (c?.interno ? c?.unidade_nome : c?.endereco) || c?.endereco || '',
    encerrada_em: e.encerrada_em,
  }
}

// Equipes em campo (não encerradas)
export function useEquipesAtivas() {
  return useQuery({
    queryKey: ['equipes', { ativas: 1 }],
    queryFn: () => equipesApi.listar({ ativas: 1 }),
    select: (lista) => lista.map(adaptaEquipe),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

// Todas as equipes, separadas por fase (tela de Equipes)
export function useEquipes(filtros = {}) {
  return useQuery({
    queryKey: ['equipes', filtros],
    queryFn: () => equipesApi.listar(filtros),
    refetchInterval: 20_000,
    staleTime: 5_000,
  })
}

function useInvalidarEquipes() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['equipes'] })
    qc.invalidateQueries({ queryKey: ['chamados'] })
    qc.invalidateQueries({ queryKey: ['tecnicos'] })
  }
}

export function useCriarEquipe() {
  const invalidar = useInvalidarEquipes()
  return useMutation({ mutationFn: (body) => equipesApi.criar(body), onSuccess: invalidar })
}

export function useEditarEquipe() {
  const invalidar = useInvalidarEquipes()
  return useMutation({ mutationFn: ({ id, ...body }) => equipesApi.editar(id, body), onSuccess: invalidar })
}

// Desfaz um lobby que nunca foi povoado (não vira equipe fantasma)
export function useExcluirEquipe() {
  const invalidar = useInvalidarEquipes()
  return useMutation({ mutationFn: (id) => equipesApi.excluir(id), onSuccess: invalidar })
}

// ---- ações do fluxo ----
export function useEntrarEquipe() {
  const invalidar = useInvalidarEquipes()
  return useMutation({
    mutationFn: ({ id, tecnicoId }) => equipesApi.entrar(id, tecnicoId),
    onSuccess: invalidar,
  })
}

export function useSairEquipe() {
  const invalidar = useInvalidarEquipes()
  return useMutation({
    mutationFn: ({ id, tecnicoId }) => equipesApi.sair(id, tecnicoId),
    onSuccess: invalidar,
  })
}

export function useDespacharEquipe() {
  const invalidar = useInvalidarEquipes()
  return useMutation({
    mutationFn: ({ id, chamadoId }) => equipesApi.despachar(id, chamadoId),
    onSuccess: invalidar,
  })
}

export function useEncerrarEquipe() {
  const invalidar = useInvalidarEquipes()
  return useMutation({
    mutationFn: ({ id, motivo, observacoes }) =>
      equipesApi.encerrar(id, { motivo_encerramento: motivo, observacoes: observacoes || '' }),
    onSuccess: invalidar,
  })
}
