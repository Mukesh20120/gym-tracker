import { useState, useCallback } from 'react'
import {
  createWorkoutDay,
  updateWorkoutDay,
  deleteWorkoutDay,
  saveWorkoutDayExercises,
} from '../api/client'

export function useWorkoutDayEditor(refetch) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  const run = useCallback(async (fn) => {
    setSaving(true)
    setError(null)
    try {
      const result = await fn()
      await refetch()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [refetch])

  const createDay = useCallback((name) => run(() => createWorkoutDay(name)), [run])
  const renameDay = useCallback((id, name) => run(() => updateWorkoutDay(id, name)), [run])
  const removeDay = useCallback((id) => run(() => deleteWorkoutDay(id)), [run])
  const saveExercises = useCallback((dayId, exercises) => run(() => saveWorkoutDayExercises(dayId, exercises)), [run])

  return { createDay, renameDay, removeDay, saveExercises, saving, error, clearError }
}
