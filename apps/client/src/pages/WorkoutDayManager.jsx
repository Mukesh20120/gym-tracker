import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutDays } from '../hooks/useWorkoutDays'
import { useWorkoutDayEditor } from '../hooks/useWorkoutDayEditor'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

const MAX_DAYS = 20

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function WorkoutDayRow({ day, onEdit, onDelete, canDelete }) {
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    onDelete(day.id)
    setConfirming(false)
  }

  return (
    <Card className="flex items-center gap-3">
      <button
        onClick={() => onEdit(day)}
        className="flex flex-1 items-center justify-between active:opacity-70"
      >
        <div className="text-left">
          <p className="font-semibold text-gray-100">{day.name}</p>
          <p className="text-xs text-gray-500">
            {day.exercises.length === 0 ? 'Rest day' : `${day.exercises.length} exercises`}
          </p>
        </div>
        <ChevronRight />
      </button>

      {canDelete && (
        <button
          onClick={handleDelete}
          className={`flex-shrink-0 rounded-full p-2 transition-colors ${
            confirming
              ? 'bg-red-500/20 text-red-400'
              : 'text-gray-600 hover:text-red-400'
          }`}
          aria-label={confirming ? 'Tap again to confirm delete' : `Delete ${day.name}`}
          title={confirming ? 'Tap again to confirm' : 'Delete'}
        >
          <TrashIcon />
        </button>
      )}
    </Card>
  )
}

export default function WorkoutDayManager() {
  const navigate = useNavigate()
  const { days, loading, error, refetch } = useWorkoutDays()
  const { createDay, removeDay, saving, error: editorError } = useWorkoutDayEditor(refetch)

  const [showNewDayForm, setShowNewDayForm] = useState(false)
  const [newDayName, setNewDayName] = useState('')

  async function handleCreate() {
    const name = newDayName.trim()
    if (!name) return
    try {
      await createDay(name)
      setNewDayName('')
      setShowNewDayForm(false)
    } catch {
      // error shown via editorError
    }
  }

  function handleEdit(day) {
    navigate(`/settings/days/${day.id}`, { state: { day } })
  }

  const atLimit = days.length >= MAX_DAYS

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Workout Days"
        action={
          !atLimit && (
            <button
              onClick={() => setShowNewDayForm((v) => !v)}
              className="rounded-full p-2 text-indigo-400 hover:bg-gray-800 transition-colors"
              aria-label="Add workout day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>
          )
        }
      />

      <div className="flex flex-col gap-3 px-4 pb-6">
        {/* New day form */}
        {showNewDayForm && (
          <Card className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-300">New Workout Day</p>
            <input
              type="text"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Arms Day, Full Body…"
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!newDayName.trim() || saving} className="flex-1">
                {saving ? 'Creating…' : 'Create'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowNewDayForm(false); setNewDayName('') }} className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {(error || editorError) && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error || editorError}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <>
            {days.map((day) => (
              <WorkoutDayRow
                key={day.id}
                day={day}
                onEdit={handleEdit}
                onDelete={removeDay}
                canDelete={days.length > 1}
              />
            ))}
            {atLimit && (
              <p className="text-center text-xs text-gray-600 pt-2">
                Maximum of {MAX_DAYS} workout days reached.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
