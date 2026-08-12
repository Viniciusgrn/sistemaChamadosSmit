import { createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'

// Sessão real (cookie de sessão do Django). user = payload de /usuarios/sessao/:
// { id, username, nome_completo, matricula, email, eh_dit, is_superuser,
//   precisa_trocar_senha, divisao, unidade_id }

const AuthContext = createContext(null)

// Perfil de UI — quem decide é o backend (core/papeis.perfil_operacional),
// pra que o menu e as regras da API não possam divergir:
//   'gestao'      sistema completo (despachante, chefe, secretário, TI)
//   'tecnico'     versão de campo, mobile-first: atende chamado
//   'aprendiz'    versão de campo, só acompanha: entra em equipe e observa
//   'solicitante' portal restrito: abre e acompanha os próprios chamados
export function perfilFromUser(user) {
  if (!user) return null
  if (user.perfil) return user.perfil
  // fallback pra sessão antiga em cache, antes do campo existir
  return user.eh_dit ? 'gestao' : 'solicitante'
}

// os dois perfis de campo compartilham telas e layout
export const PERFIS_CAMPO = ['tecnico', 'aprendiz']
export const ehPerfilCampo = (perfil) => PERFIS_CAMPO.includes(perfil)

export function AuthProvider({ children }) {
  const qc = useQueryClient()

  const { data: user = null, isLoading } = useQuery({
    queryKey: ['sessao'],
    queryFn: async () => {
      try {
        return await authApi.sessao()
      } catch (e) {
        if (e.status === 401 || e.status === 403) return null
        throw e
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: ({ username, password }) => authApi.login(username, password),
    onSuccess: (payload) => {
      qc.setQueryData(['sessao'], payload)
      qc.invalidateQueries() // dados podem depender de quem está logado
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      qc.setQueryData(['sessao'], null)
      qc.clear()
    },
  })

  const value = {
    user,
    perfil: perfilFromUser(user),
    isAuthenticated: !!user,
    isLoading,
    login: loginMutation,
    logout: logoutMutation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
