import { useState, useCallback } from 'react'
import { postWorkout } from '../api/client'
import { enqueueWorkout } from './useOfflineQueue'

function makeSet(weight, reps) {
  return { weight: String(weight), reps: String(reps), done: false }
}

/** Build initial session state from a template's exercise list. */
export function initSession(exercises) {
  return Object.fromEntries(
    exercises.map((ex) => [
      ex.exercise_name,
      Array.from({ length: Number(ex.default_sets) }, () =>
        makeSet(ex.default_weight_kg, ex.default_reps.split('-')[0])
      ),
    ])
  )
}

export function useWorkoutSession() {
  const [sets, setSets] = useState({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // { saved, sets, queued? } on success
  const [saveError, setSaveError] = useState(null)

  const init = useCallback((exercises) => {
    setSets(initSession(exercises))
    setResult(null)
    setSaveError(null)
  }, [])

  const updateSet = useCallback((exerciseName, index, field, value) => {
    setSets((prev) => {
      const copy = prev[exerciseName].map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
      return { ...prev, [exerciseName]: copy }
    })
  }, [])

  const toggleDone = useCallback((exerciseName, index) => {
    setSets((prev) => {
      const copy = prev[exerciseName].map((s, i) =>
        i === index ? { ...s, done: !s.done } : s
      )
      return { ...prev, [exerciseName]: copy }
    })
  }, [])

  const addSet = useCallback((exerciseName) => {
    setSets((prev) => {
      const existing = prev[exerciseName]
      const last = existing[existing.length - 1] ?? { weight: '0', reps: '10' }
      return { ...prev, [exerciseName]: [...existing, makeSet(last.weight, last.reps)] }
    })
  }, [])

  const removeSet = useCallback((exerciseName, index) => {
    setSets((prev) => {
      const copy = prev[exerciseName].filter((_, i) => i !== index)
      return { ...prev, [exerciseName]: copy }
    })
  }, [])

  const save = useCallback(async (dayName) => {
    setSaving(true)
    setSaveError(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const payload = {
        date: today,
        day_name: dayName,
        sets: Object.entries(sets).flatMap(([exercise_name, rows]) =>
          rows.map((s, i) => ({
            exercise_name,
            set_number: i + 1,
            reps: Number(s.reps) || 0,
            weight_kg: Number(s.weight) || 0,
            notes: '',
          }))
        ),
      }
      if (!navigator.onLine) {
        enqueueWorkout(payload)
        setResult({ queued: true })
      } else {
        const data = await postWorkout(payload)
        setResult(data)
      }
    } catch (err) {
      // Network failed mid-request — queue for retry
      if (!navigator.onLine || err.message?.toLowerCase().includes('failed to fetch')) {
        enqueueWorkout(payload)
        setResult({ queued: true })
      } else {
        setSaveError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }, [sets])

  const reset = useCallback(() => {
    setSets({})
    setResult(null)
    setSaveError(null)
  }, [])

  return { sets, init, updateSet, toggleDone, addSet, removeSet, save, saving, result, saveError, reset }
}
