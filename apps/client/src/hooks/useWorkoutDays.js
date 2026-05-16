import { useState, useEffect, useCallback } from 'react'
import { getWorkoutDays } from '../api/client'

export function useWorkoutDays() {
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getWorkoutDays()
      .then((data) => setDays(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tick])

  return { days, loading, error, refetch }
}
