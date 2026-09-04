import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'

import AppLayout from './AppLayout'
import PortalLayout from './PortalLayout'
import CampoLayout from './CampoLayout'
import ChamadoAtual from '../pages/campo/ChamadoAtual'
import ChamadosCampo from '../pages/campo/ChamadosCampo'
import ChamadoDetalhe from '../pages/campo/ChamadoDetalhe'
import MapeamentoRede from '../pages/rede/MapeamentoRede'
import Placeholder from '../pages/Placeholder'
import Login from '../pages/auth/Login'
import Perfil from '../pages/perfil/Perfil'

import Chamados from '../pages/chamados/Chamados'
import ChamadosTecnico from '../pages/chamados/Tecnico'
import ChamadosSolicitante from '../pages/chamados/Solicitante'
import Unidades from '../pages/unidades/Unidades'
import Automoveis from '../pages/automoveis/Automoveis'
import Equipes from '../pages/equipes/Equipes'
import Secretarias from '../pages/secretarias/Secretarias'
import Terceirizadas from '../pages/terceirizadas/Terceirizadas'
import Tecnicos from '../pages/tecnicos/Tecnicos'
import Equipamentos from '../pages/equipamentos/Equipamentos'
import Manutencao from '../pages/manutencao/Manutencao'
import Ramais from '../pages/ramais/Ramais'
import Solicitacoes from '../pages/solicitacoes/Solicitacoes'

export default function AppRoutes() {
  const { isAuthenticated, isLoading, perfil } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#f7f7f4' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8b8d96' }} strokeWidth={1.75} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  // Solicitante (não-DIT): portal restrito - abre/acompanha chamados + perfil
  if (perfil === 'solicitante') {
    return (
      <Routes>
        <Route element={<PortalLayout />}>
          <Route index element={<ChamadosSolicitante />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    )
  }

  // Técnico e aprendiz: versão de campo, mobile-first. Mesmas telas pros dois —
  // o que muda são as ações, e isso o backend também recusa (core/permissions).
  if (perfil === 'tecnico' || perfil === 'aprendiz') {
    return (
      <Routes>
        <Route element={<CampoLayout />}>
          <Route index element={<Navigate to="/chamado-atual" replace />} />

          <Route path="chamado-atual" element={<ChamadoAtual />} />
          <Route path="chamados" element={<ChamadosCampo />} />
          {/* consulta de chamado já feito, aberta pela aba Concluídos */}
          <Route path="chamados/:id" element={<ChamadoDetalhe />} />
          <Route path="manutencao" element={<Manutencao />} />

          <Route path="equipamentos" element={<Equipamentos />} />
          <Route path="rede" element={<MapeamentoRede />} />
          <Route path="ramais" element={<Ramais />} />
          <Route path="automoveis" element={<Automoveis />} />
          <Route path="unidades" element={<Unidades />} />

          <Route path="tecnicos" element={<Tecnicos />} />
          <Route path="equipes" element={<Equipes />} />
          <Route path="terceirizadas" element={<Terceirizadas />} />

          <Route path="perfil" element={<Perfil />} />
          <Route path="*" element={<Navigate to="/chamado-atual" replace />} />
        </Route>
      </Routes>
    )
  }

  // Gestão (despachante, chefe, secretário, TI): sistema completo
  return (
    <Routes>
      <Route element={<AppLayout />}>

        <Route index element={<Navigate to="/chamados" replace />} />

        <Route path="chamados" element={<Chamados />} />
        <Route path="chamados/despachante" element={<Chamados />} />
        <Route path="chamados/tecnico" element={<ChamadosTecnico />} />
        <Route path="chamados/solicitante" element={<ChamadosSolicitante />} />

        <Route path="manutencao" element={<Manutencao />} />

        <Route path="equipamentos" element={<Equipamentos />} />
        <Route path="rede" element={<MapeamentoRede />} />
        <Route path="ramais" element={<Ramais />} />
        <Route path="automoveis" element={<Automoveis />} />
        <Route path="unidades" element={<Unidades />} />

        <Route path="tecnicos" element={<Tecnicos />} />
        <Route path="equipes" element={<Equipes />} />
        <Route path="solicitacoes" element={<Solicitacoes />} />

        <Route path="secretarias" element={<Secretarias />} />
        <Route path="terceirizadas" element={<Terceirizadas />} />

        <Route path="perfil" element={<Perfil />} />

        <Route
          path="*"
          element={
            <Placeholder
              titulo="404"
              descricao="Página não encontrada."
            />
          }
        />
      </Route>
    </Routes>
  )
}
