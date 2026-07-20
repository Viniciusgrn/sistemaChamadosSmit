import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ChamadosRedirect() {
  const { perfil } = useAuth()

  if (!perfil) return <Navigate to="/" replace />

  return <Navigate to={`/chamados/${perfil}`} replace />
}
