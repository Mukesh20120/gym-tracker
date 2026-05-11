import { useEffect, useState } from 'react'
import { getTemplate } from '../api/client'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function todayDayName() {
  return DAY_NAMES[new Date().getDay()]
}

export function useTemplate() {
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const dayName = todayDayName()

  useEffect(() => {
    setLoading(true)
    setError(null)
    getTemplate(dayName)
      .then((data) => setTemplate(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [dayName])

  return { template, loading, error, dayName }
}
