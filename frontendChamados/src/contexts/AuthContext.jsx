import { createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'

// Sessão real (cookie de sessão do Django). user = payload de /usuarios/sessao/:
// { id, username, nome_completo, matricula, email, eh_dit, is_superuser,
//   precisa_trocar_senha, divisao, unidade_id }

const AuthContext = createContext(null)

// perfil de UI: 'dit' tem o sistema completo; 'solicitante' só abre chamados.
// (despachante/técnico virão do futuro model Tecnico.)
export function perfilFromUser(user) {
  if (!user) return null
  return user.eh_dit ? 'dit' : 'solicitante'
}

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
