import { useEffect, useState } from 'react'
import { getAllWorkouts } from '../api/client'

export function useAllWorkouts() {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAllWorkouts()
      .then(setWorkouts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { workouts, loading, error }
}
