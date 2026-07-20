import { Outlet } from 'react-router-dom'
import Sidebar from '../pages/Sidebar/Sidebar'
import AlertaTrocaSenha from '../components/AlertaTrocaSenha'


export default function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <AlertaTrocaSenha />
        <main className="flex-1 overflow-y-auto relative w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
