const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // Session expired or was invalidated — send user back to login.
    if (res.status === 401) {
      window.location.assign('/login')
      return
    }
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

/** Fetch the current user's workout days with their exercises. */
export function getWorkoutDays() {
  return request('/workout-days')
}

/** Create a new custom workout day. */
export function createWorkoutDay(name) {
  return request('/workout-days', { method: 'POST', body: JSON.stringify({ name }) })
}

/** Rename a workout day. */
export function updateWorkoutDay(id, name) {
  return request(`/workout-days/${id}`, { method: 'PUT', body: JSON.stringify({ name }) })
}

/** Delete a workout day. */
export function deleteWorkoutDay(id) {
  return request(`/workout-days/${id}`, { method: 'DELETE' })
}

/** Replace the full exercise list for a workout day. */
export function saveWorkoutDayExercises(dayId, exercises) {
  return request(`/workout-days/${dayId}/exercises`, { method: 'PUT', body: JSON.stringify({ exercises }) })
}

/** Fetch the full exercise catalog. */
export function getExercises() {
  return request('/exercises')
}
