const { Router } = require('express')
const { requireAuth } = require('../middleware/requireAuth')
const {
  ensureDefaultDaysForUser,
  getDaysForUser,
  createDay,
  renameDay,
  deleteDay,
  saveExercisesForDay,
  MAX_WORKOUT_DAYS,
} = require('../services/workoutDayService')

const router = Router()
router.use(requireAuth)

// GET /api/workout-days — list all workout days for the current user (seeds defaults on first call)
router.get('/', async (req, res) => {
  try {
    await ensureDefaultDaysForUser(req.session.userId)
    const days = await getDaysForUser(req.session.userId)
    res.json(days)
  } catch (err) {
    console.error(err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch workout days' })
  }
})

// POST /api/workout-days — create a new custom workout day
router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const day = await createDay(req.session.userId, name)
    res.status(201).json({ id: day.id, name: day.name, is_default: day.is_default, exercises: [] })
  } catch (err) {
    console.error(err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to create workout day' })
  }
})

// PUT /api/workout-days/:id — rename a workout day
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const day = await renameDay(req.params.id, req.session.userId, name)
    res.json({ id: day.id, name: day.name, is_default: day.is_default })
  } catch (err) {
    console.error(err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to rename workout day' })
  }
})

// DELETE /api/workout-days/:id — delete a workout day
router.delete('/:id', async (req, res) => {
  try {
    await deleteDay(req.params.id, req.session.userId)
    res.json({ deleted: true })
  } catch (err) {
    console.error(err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete workout day' })
  }
})

// PUT /api/workout-days/:id/exercises — replace the full exercise list for a day
router.put('/:id/exercises', async (req, res) => {
  try {
    const { exercises } = req.body
    if (!Array.isArray(exercises)) {
      return res.status(400).json({ error: 'exercises must be an array' })
    }
    await saveExercisesForDay(req.params.id, req.session.userId, exercises)
    res.json({ saved: exercises.length })
  } catch (err) {
    console.error(err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to save exercises' })
  }
})

module.exports = router
