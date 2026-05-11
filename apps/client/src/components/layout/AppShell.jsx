import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
