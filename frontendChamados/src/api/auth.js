import { apiFetch } from './client'

export const authApi = {
  login:       (username, password) => apiFetch('/usuarios/login/', { method: 'POST', body: { username, password } }),
  logout:      ()                   => apiFetch('/usuarios/logout/', { method: 'POST' }),
  sessao:      ()                   => apiFetch('/usuarios/sessao/'),
  trocarSenha: (senha_atual, nova_senha) =>
    apiFetch('/usuarios/trocar-senha/', { method: 'POST', body: { senha_atual, nova_senha } }),
}
