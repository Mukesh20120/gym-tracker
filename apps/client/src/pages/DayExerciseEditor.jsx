import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  useGetWorkoutDaysQuery,
  useSaveWorkoutDayExercisesMutation,
} from '../store/api/gymApi'
import ExercisePicker from '../components/ui/ExercisePicker'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

function ArrowUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}

export default function DayExerciseEditor() {
  const navigate = useNavigate()
  const { dayId } = useParams()
  const { state } = useLocation()

  const { data: days = [], isLoading: daysLoading } = useGetWorkoutDaysQuery()
  const [saveWorkoutDayExercises, { isLoading: saving }] = useSaveWorkoutDayExercisesMutation()

  const day = state?.day ?? days.find((d) => d.id === dayId)

  const [localExercises, setLocalExercises] = useState([])
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (day) {
      setLocalExercises(day.exercises.map((ex, i) => ({ ...ex, _key: ex.id ?? String(i) })))
      setDirty(false)
    }
  }, [day?.id])

  function mutate(fn) {
    setLocalExercises((prev) => fn(prev))
    setDirty(true)
  }

  function moveUp(index) {
    if (index === 0) return
    mutate((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index) {
    mutate((prev) => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function removeAt(index) {
    mutate((prev) => prev.filter((_, i) => i !== index))
  }

  function addExercise(exercise) {
    mutate((prev) => [
      ...prev,
      { ...exercise, sort_order: prev.length, _key: `new_${Date.now()}` },
    ])
  }

  async function handleSave() {
    setError(null)
    const payload = localExercises.map((ex, i) => ({
      exercise_name: ex.exercise_name,
      exercise_id: ex.exercise_id || null,
      default_sets: ex.default_sets ?? 3,
      default_reps: ex.default_reps ?? '8-10',
      default_weight_kg: ex.default_weight_kg ?? 0,
      sort_order: i,
    }))
    const result = await saveWorkoutDayExercises({ dayId, exercises: payload })
    if (result.error) {
      setError(result.error.data ?? 'Failed to save exercises')
    } else {
      navigate(-1)
    }
  }

  if (daysLoading && !day) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (!day) {
    return (
      <div className="flex flex-col px-4 py-8 text-center">
        <p className="text-red-400">Workout day not found.</p>
        <Button variant="secondary" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const existingNames = localExercises.map((ex) => ex.exercise_name)

  return (
    <div className="flex flex-col">
      <PageHeader
        title={day.name}
        action={
          dirty && (
            <Button onClick={handleSave} disabled={saving} className="py-1.5 px-4 text-sm">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-4 px-4 pb-6">
        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {localExercises.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-4">
            No exercises yet. Add some below.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {localExercises.map((ex, i) => (
              <div
                key={ex._key}
                className="flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3"
              >
                <span className="flex-1 text-sm font-medium text-gray-100">{ex.exercise_name}</span>

                <div className="flex flex-col">
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="p-0.5 text-gray-600 disabled:opacity-20 hover:text-gray-300 transition-colors"
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i === localExercises.length - 1}
                    className="p-0.5 text-gray-600 disabled:opacity-20 hover:text-gray-300 transition-colors"
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </button>
                </div>

                <button
                  onClick={() => removeAt(i)}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                  aria-label={`Remove ${ex.exercise_name}`}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          Add Exercise
        </p>
        <ExercisePicker onAdd={addExercise} existingNames={existingNames} />

        {dirty && (
          <Button onClick={handleSave} disabled={saving} className="w-full py-4 text-base">
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </div>
    </div>
  )
}
