import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-3 px-4 pb-6">
        <Card
          onClick={() => navigate('/settings/days')}
          className="flex cursor-pointer items-center justify-between active:bg-gray-800"
        >
          <div>
            <p className="font-semibold text-gray-100">Workout Days</p>
            <p className="text-xs text-gray-500">Manage your training schedule &amp; exercises</p>
          </div>
          <ChevronRight />
        </Card>

        {user && (
          <p className="px-1 text-xs text-gray-600">Signed in as {user.email}</p>
        )}

        <Card
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-3 text-red-400 active:bg-gray-800"
        >
          <LogOutIcon />
          <span className="font-semibold">Sign Out</span>
        </Card>
      </div>
    </div>
  )
}
