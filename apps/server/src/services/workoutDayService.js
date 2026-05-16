const AppDataSource = require('../db/dataSource')

const MAX_WORKOUT_DAYS = 20
const DEFAULT_DAY_COUNT = 7

// Default workout days seeded per-user on first access.
// Exercise IDs match the exercises table seeded in seed.js.
const DEFAULT_WORKOUT_DAYS = [
  {
    name: 'Push Day',
    is_default: true,
    exercises: [
      { sort_order: 1, exercise_name: 'Bench Press',            exercise_id: 'e7',  default_sets: 4, default_reps: '6-8',   default_weight_kg: 40 },
      { sort_order: 2, exercise_name: 'Overhead Press',         exercise_id: 'e8',  default_sets: 3, default_reps: '8-10',  default_weight_kg: 25 },
      { sort_order: 3, exercise_name: 'Incline Dumbbell Press', exercise_id: 'e9',  default_sets: 3, default_reps: '10-12', default_weight_kg: 18 },
      { sort_order: 4, exercise_name: 'Lateral Raise',          exercise_id: 'e10', default_sets: 3, default_reps: '12-15', default_weight_kg: 8  },
      { sort_order: 5, exercise_name: 'Tricep Pushdown',        exercise_id: 'e11', default_sets: 3, default_reps: '12-15', default_weight_kg: 15 },
      { sort_order: 6, exercise_name: 'Chest Fly',              exercise_id: 'e12', default_sets: 3, default_reps: '12-15', default_weight_kg: 10 },
    ],
  },
  {
    name: 'Pull Day',
    is_default: true,
    exercises: [
      { sort_order: 1, exercise_name: 'Deadlift',    exercise_id: 'e13', default_sets: 3, default_reps: '5-6',   default_weight_kg: 50 },
      { sort_order: 2, exercise_name: 'Pull Up',     exercise_id: 'e14', default_sets: 3, default_reps: '6-8',   default_weight_kg: 0  },
      { sort_order: 3, exercise_name: 'Barbell Row', exercise_id: 'e15', default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
      { sort_order: 4, exercise_name: 'Face Pull',   exercise_id: 'e16', default_sets: 3, default_reps: '15-20', default_weight_kg: 10 },
      { sort_order: 5, exercise_name: 'Bicep Curl',  exercise_id: 'e17', default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },
      { sort_order: 6, exercise_name: 'Hammer Curl', exercise_id: 'e18', default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },
    ],
  },
  {
    name: 'Leg Day',
    is_default: true,
    exercises: [
      { sort_order: 1, exercise_name: 'Squat',             exercise_id: 'e1', default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
      { sort_order: 2, exercise_name: 'Romanian Deadlift', exercise_id: 'e2', default_sets: 3, default_reps: '10-12', default_weight_kg: 30 },
      { sort_order: 3, exercise_name: 'Leg Press',         exercise_id: 'e3', default_sets: 3, default_reps: '12-15', default_weight_kg: 60 },
      { sort_order: 4, exercise_name: 'Leg Curl',          exercise_id: 'e4', default_sets: 3, default_reps: '12-15', default_weight_kg: 25 },
      { sort_order: 5, exercise_name: 'Calf Raise',        exercise_id: 'e5', default_sets: 4, default_reps: '15-20', default_weight_kg: 40 },
      { sort_order: 6, exercise_name: 'Leg Extension',     exercise_id: 'e6', default_sets: 3, default_reps: '12-15', default_weight_kg: 30 },
    ],
  },
  {
    name: 'Chest Day',
    is_default: true,
    exercises: [
      { sort_order: 1, exercise_name: 'Bench Press',            exercise_id: 'e7',  default_sets: 4, default_reps: '6-8',   default_weight_kg: 40 },
      { sort_order: 2, exercise_name: 'Incline Dumbbell Press', exercise_id: 'e9',  default_sets: 3, default_reps: '10-12', default_weight_kg: 18 },
      { sort_order: 3, exercise_name: 'Chest Fly',              exercise_id: 'e12', default_sets: 3, default_reps: '12-15', default_weight_kg: 10 },
    ],
  },
  {
    name: 'Back Day',
    is_default: true,
    exercises: [
      { sort_order: 1, exercise_name: 'Deadlift',    exercise_id: 'e13', default_sets: 3, default_reps: '5-6',   default_weight_kg: 50 },
      { sort_order: 2, exercise_name: 'Pull Up',     exercise_id: 'e14', default_sets: 3, default_reps: '6-8',   default_weight_kg: 0  },
      { sort_order: 3, exercise_name: 'Barbell Row', exercise_id: 'e15', default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
      { sort_order: 4, exercise_name: 'Face Pull',   exercise_id: 'e16', default_sets: 3, default_reps: '15-20', default_weight_kg: 10 },
    ],
  },
  {
    name: 'Shoulder Day',
    is_default: true,
    exercises: [
      { sort_order: 1, exercise_name: 'Overhead Press', exercise_id: 'e8',  default_sets: 3, default_reps: '8-10',  default_weight_kg: 25 },
      { sort_order: 2, exercise_name: 'Lateral Raise',  exercise_id: 'e10', default_sets: 3, default_reps: '12-15', default_weight_kg: 8  },
      { sort_order: 3, exercise_name: 'Face Pull',      exercise_id: 'e16', default_sets: 3, default_reps: '15-20', default_weight_kg: 10 },
    ],
  },
  {
    name: 'Rest Day',
    is_default: true,
    exercises: [],
  },
]

function dayRepo() {
  return AppDataSource.getRepository('WorkoutDay')
}

// Seed the 7 default workout days for a user if they have none yet.
// Wrapped in a transaction so concurrent first requests don't double-seed.
async function ensureDefaultDaysForUser(userId) {
  await AppDataSource.transaction(async (manager) => {
    const count = await manager.getRepository('WorkoutDay').countBy({ user_id: userId })
    if (count > 0) return

    for (const day of DEFAULT_WORKOUT_DAYS) {
      const saved = await manager.getRepository('WorkoutDay').save({
        user_id: userId,
        name: day.name,
        is_default: true,
      })
      if (day.exercises.length > 0) {
        await manager.getRepository('WorkoutDayExercise').insert(
          day.exercises.map((e) => ({ ...e, workout_day_id: saved.id }))
        )
      }
    }
  })
}

// Return all workout days for a user, with their exercises ordered by sort_order.
async function getDaysForUser(userId) {
  const days = await dayRepo().find({
    where: { user_id: userId },
    order: { created_at: 'ASC' },
  })

  if (days.length === 0) return []

  const dayIds = days.map((d) => d.id)

  // Fetch exercises with muscle_group from the catalog via a LEFT JOIN.
  const exercises = await AppDataSource.createQueryBuilder()
    .select([
      'wde.id           AS id',
      'wde.workout_day_id AS workout_day_id',
      'wde.sort_order   AS sort_order',
      'wde.exercise_name AS exercise_name',
      'wde.exercise_id  AS exercise_id',
      'wde.default_sets AS default_sets',
      'wde.default_reps AS default_reps',
      'wde.default_weight_kg AS default_weight_kg',
      'e.muscle_group   AS muscle_group',
    ])
    .from('workout_day_exercises', 'wde')
    .leftJoin('exercises', 'e', 'e.id = wde.exercise_id')
    .where('wde.workout_day_id IN (:...dayIds)', { dayIds })
    .orderBy('wde.sort_order', 'ASC')
    .getRawMany()

  // Group exercises by day.
  const exByDay = {}
  for (const ex of exercises) {
    if (!exByDay[ex.workout_day_id]) exByDay[ex.workout_day_id] = []
    exByDay[ex.workout_day_id].push({
      id: ex.id,
      sort_order: Number(ex.sort_order),
      exercise_name: ex.exercise_name,
      exercise_id: ex.exercise_id,
      default_sets: Number(ex.default_sets),
      default_reps: ex.default_reps,
      default_weight_kg: parseFloat(ex.default_weight_kg) || 0,
      muscle_group: ex.muscle_group || null,
    })
  }

  return days.map((d) => ({
    id: d.id,
    name: d.name,
    is_default: d.is_default,
    exercises: exByDay[d.id] || [],
  }))
}

// Create a new custom workout day.
async function createDay(userId, name) {
  const count = await dayRepo().countBy({ user_id: userId })
  if (count >= MAX_WORKOUT_DAYS) {
    const err = new Error(`Maximum of ${MAX_WORKOUT_DAYS} workout days allowed`)
    err.statusCode = 400
    throw err
  }
  return dayRepo().save({ user_id: userId, name: name.trim(), is_default: false })
}

// Rename a workout day. Returns updated row or throws 404.
async function renameDay(dayId, userId, newName) {
  const day = await getOwnedDay(dayId, userId)
  day.name = newName.trim()
  return dayRepo().save(day)
}

// Delete a workout day. Exercises cascade automatically.
async function deleteDay(dayId, userId) {
  const day = await getOwnedDay(dayId, userId)
  await dayRepo().remove(day)
}

// Replace the full exercise list for a day (add/remove/reorder in one call).
async function saveExercisesForDay(dayId, userId, exercises) {
  await getOwnedDay(dayId, userId) // ownership check

  await AppDataSource.transaction(async (manager) => {
    await manager.delete('WorkoutDayExercise', { workout_day_id: dayId })
    if (exercises.length > 0) {
      await manager.insert(
        'WorkoutDayExercise',
        exercises.map((ex, i) => ({
          workout_day_id: dayId,
          sort_order: ex.sort_order ?? i,
          exercise_name: ex.exercise_name,
          exercise_id: ex.exercise_id || null,
          default_sets: ex.default_sets ?? 3,
          default_reps: ex.default_reps ?? '8-10',
          default_weight_kg: ex.default_weight_kg ?? 0,
        }))
      )
    }
  })
}

// Verify a workout day belongs to the given user; throws 404 otherwise.
async function getOwnedDay(dayId, userId) {
  const day = await dayRepo().findOneBy({ id: dayId, user_id: userId })
  if (!day) {
    const err = new Error('Workout day not found')
    err.statusCode = 404
    throw err
  }
  return day
}

module.exports = {
  ensureDefaultDaysForUser,
  getDaysForUser,
  createDay,
  renameDay,
  deleteDay,
  saveExercisesForDay,
  MAX_WORKOUT_DAYS,
  DEFAULT_DAY_COUNT,
}
