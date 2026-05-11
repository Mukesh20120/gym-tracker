const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`
    throw Object.assign(new Error(message), { status: res.status, data })
  }
  return data
}

/** Fetch the exercise template for a given day name (e.g. 'Monday') */
export function getTemplate(day) {
  return request(`/templates/${day}`)
}

/** Fetch all logged workouts, optionally filtered by date (YYYY-MM-DD) */
export function getWorkouts(date) {
  return request(date ? `/workouts/${date}` : '/workouts')
}

/** Fetch all workouts (no date filter) — used by dashboard and progress pages */
export function getAllWorkouts() {
  return request('/workouts')
}

/**
 * Save a completed workout session.
 * @param {{ date: string, day_name: string, sets: Array<{ exercise_name, set_number, reps, weight_kg, notes? }> }} payload
 */
export function postWorkout(payload) {
  return request('/workouts', { method: 'POST', body: JSON.stringify(payload) })
}
