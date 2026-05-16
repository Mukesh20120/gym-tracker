const { Router } = require('express')
const { v4: uuidv4 } = require('uuid')
const { requireAuth } = require('../middleware/requireAuth')
const {
  getAllWorkouts,
  getWorkoutsByDate,
  saveWorkoutSets,
  getMaxWeightPerExercise,
} = require('../services/dbService')

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const rows = await getAllWorkouts(req.session.userId)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch workouts' })
  }
})

router.get('/:date', async (req, res) => {
  try {
    const rows = await getWorkoutsByDate(req.params.date, req.session.userId)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch workouts for date' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { date, day_name, sets } = req.body
    if (!date || !day_name || !Array.isArray(sets) || sets.length === 0) {
      return res.status(400).json({ error: 'date, day_name, and sets[] are required' })
    }

    const prMap = await getMaxWeightPerExercise(req.session.userId)
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
        user_id: req.session.userId,
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
