import { useState, useEffect } from 'react'
import { getExercises } from '../api/client'

export function useExerciseCatalog() {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getExercises()
      .then((data) => setExercises(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { exercises, loading, error }
}
