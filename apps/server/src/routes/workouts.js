const { Router } = require('express')
const { v4: uuidv4 } = require('uuid')
const {
  getAllWorkouts,
  getWorkoutsByDate,
  saveWorkoutSets,
  getMaxWeightPerExercise,
} = require('../services/dbService')

const router = Router()

// GET /api/workouts — all logged workouts
router.get('/', async (_req, res) => {
  try {
    const rows = await getAllWorkouts()
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch workouts' })
  }
})

// GET /api/workouts/:date — workouts for a specific date (YYYY-MM-DD)
router.get('/:date', async (req, res) => {
  try {
    const rows = await getWorkoutsByDate(req.params.date)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch workouts for date' })
  }
})

// POST /api/workouts — log a new workout session
// Body: { date, day_name, sets: [{ exercise_name, set_number, reps, weight_kg, notes }] }
router.post('/', async (req, res) => {
  try {
    const { date, day_name, sets } = req.body
    if (!date || !day_name || !Array.isArray(sets) || sets.length === 0) {
      return res.status(400).json({ error: 'date, day_name, and sets[] are required' })
    }

    const prMap = await getMaxWeightPerExercise()
    const created_at = new Date()
    const rows = []

    for (const s of sets) {
      const weight = parseFloat(s.weight_kg) || 0
      const prevBest = prMap[s.exercise_name] ?? null
      const is_pr = prevBest === null ? true : weight > prevBest

      rows.push({
        id: uuidv4(),
        date,
        day_name,
        exercise_name: s.exercise_name,
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: weight,
        notes: s.notes || '',
        is_pr,
        created_at,
      })

      if (is_pr || prevBest === null) prMap[s.exercise_name] = weight
    }

    const savedSets = await saveWorkoutSets(rows)
    res.status(201).json({ saved: savedSets.length, sets: savedSets })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save workout' })
  }
})

module.exports = router
