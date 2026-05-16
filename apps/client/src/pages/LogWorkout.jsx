import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTemplate } from '../hooks/useTemplate'
import { useWorkoutSession } from '../hooks/useWorkoutSession'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SetInput from '../components/ui/SetInput'
import Spinner from '../components/ui/Spinner'

const GROUP_COLOR = { Push: 'indigo', Pull: 'green', Legs: 'red' }

export default function LogWorkout() {
  const navigate = useNavigate()
  const { state } = useLocation()

  // If navigated from Dashboard with a selected day, use it directly.
  // Otherwise fall back to the calendar-based template system.
  const selectedDay = state?.day ?? null
  const { template, loading: templateLoading, error: templateError, dayName: templateDayName } = useTemplate()

  const loading = selectedDay ? false : templateLoading
  const error = selectedDay ? null : templateError
  const dayName = selectedDay ? selectedDay.name : templateDayName
  const exercises = selectedDay ? selectedDay.exercises : template?.exercises

  const {
    sets, init, updateSet, toggleDone, addSet, removeSet,
    save, saving, result, saveError, reset,
  } = useWorkoutSession()

  // Stable key for the current exercise list — use day id (or day name as fallback for templates).
  const exerciseListKey = selectedDay?.id ?? dayName

  // Re-init whenever the workout day changes, and reset stale state on unmount.
  useEffect(() => {
    if (exercises?.length) init(exercises)
  }, [exerciseListKey, init])

  useEffect(() => {
    return () => reset()
  }, [reset])

  // Navigate home after a short success pause
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => navigate('/'), 2000)
    return () => clearTimeout(t)
  }, [result, navigate])

  // ── Rest-day ───────────────────────────────────────────────────────────────
  if (!loading && !error && (!exercises || exercises.length === 0)) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Log Workout" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-4xl">😴</p>
          <p className="text-lg font-semibold">Rest day — enjoy the recovery!</p>
          <p className="text-sm text-gray-500">No template for {dayName}.</p>
        </div>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Log Workout" />
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner className="h-10 w-10" />
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Log Workout" />
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-red-400">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (result) {
    const isQueued = result.queued === true
    return (
      <div className="flex flex-col">
        <PageHeader title={isQueued ? 'Saved Offline' : 'Workout Saved!'} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-6xl">{isQueued ? '📶' : '🎉'}</p>
          <p className="text-xl font-bold">{isQueued ? 'No connection' : 'Great session!'}</p>
          <p className="text-gray-400">
            {isQueued
              ? "Workout saved locally — will sync automatically when you're back online."
              : `${result.saved} sets logged to your sheet.`}
          </p>
          <p className="text-sm text-gray-600">Returning to dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Active session ─────────────────────────────────────────────────────────
  const sessionExercises = exercises ?? []
  const totalSets = Object.values(sets).reduce((n, rows) => n + rows.length, 0)
  const doneSets = Object.values(sets).reduce((n, rows) => n + rows.filter((s) => s.done).length, 0)

  const canSubmit = totalSets > 0 && !saving

  return (
    <div className="flex flex-col">
      <PageHeader title={dayName} />

      {/* Progress bar */}
      <div className="mx-4 mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: totalSets ? `${(doneSets / totalSets) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-gray-500">{doneSets}/{totalSets} sets</span>
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-4 px-4 pb-6">
        {sessionExercises.map((ex) => {
          const exSets = sets[ex.exercise_name] ?? []
          const groupColor = GROUP_COLOR[ex.muscle_group] ?? 'gray'

          return (
            <Card key={ex.exercise_name} className="flex flex-col gap-3">
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-100">{ex.exercise_name}</span>
                <Badge color={groupColor}>{ex.muscle_group}</Badge>
              </div>

              {/* Set rows */}
              <div className="flex flex-col gap-2">
                {exSets.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Done toggle */}
                    <button
                      onClick={() => toggleDone(ex.exercise_name, idx)}
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        s.done
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-gray-600 text-transparent'
                      }`}
                      aria-label={s.done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>

                    <div className={`flex-1 transition-opacity ${s.done ? 'opacity-40' : ''}`}>
                      <SetInput
                        setNumber={idx + 1}
                        weight={s.weight}
                        reps={s.reps}
                        onChange={(field, value) => updateSet(ex.exercise_name, idx, field, value)}
                      />
                    </div>

                    {/* Remove set — only show if more than 1 set */}
                    {exSets.length > 1 && (
                      <button
                        onClick={() => removeSet(ex.exercise_name, idx)}
                        className="flex-shrink-0 p-1 text-gray-600 hover:text-red-400 transition-colors"
                        aria-label="Remove set"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add set */}
              <button
                onClick={() => addSet(ex.exercise_name)}
                className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Add set
              </button>
            </Card>
          )
        })}

        {/* Save error */}
        {saveError && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{saveError}</p>
        )}

        {/* Finish button */}
        <Button
          onClick={() => save(dayName)}
          disabled={!canSubmit}
          className="w-full py-4 text-base"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-5 w-5" /> Saving…
            </span>
          ) : (
            'Finish Workout'
          )}
        </Button>
      </div>
    </div>
  )
}
