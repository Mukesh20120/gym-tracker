import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function Settings() {
  const navigate = useNavigate()

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
      </div>
    </div>
  )
}
