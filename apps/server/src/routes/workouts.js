const { Router } = require('express')
const { v4: uuidv4 } = require('uuid')
const { getRows, appendRow } = require('../services/sheetsService')

const router = Router()

// GET /api/workouts — all logged workouts
router.get('/', async (_req, res) => {
  try {
    const rows = await getRows('Workouts')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch workouts' })
  }
})

// GET /api/workouts/:date — workouts for a specific date (YYYY-MM-DD)
router.get('/:date', async (req, res) => {
  try {
    const rows = await getRows('Workouts')
    const filtered = rows.filter((r) => r.date === req.params.date)
    res.json(filtered)
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

    // Load previous workouts to detect PRs
    const existing = await getRows('Workouts')
    const prMap = {}
    existing.forEach((r) => {
      const key = r.exercise_name
      const w = parseFloat(r.weight_kg) || 0
      if (!prMap[key] || w > prMap[key]) prMap[key] = w
    })

    const created_at = new Date().toISOString()
    const savedSets = []

    for (const s of sets) {
      const weight = parseFloat(s.weight_kg) || 0
      const prevBest = prMap[s.exercise_name] ?? null
      const is_pr = prevBest === null ? false : weight > prevBest

      const row = {
        id: uuidv4(),
        date,
        day_name,
        exercise_name: s.exercise_name,
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: weight,
        notes: s.notes || '',
        is_pr: is_pr ? 'true' : 'false',
        created_at,
      }
      await appendRow('Workouts', row)
      savedSets.push(row)

      // Update PR map for subsequent sets in the same session
      if (is_pr || prevBest === null) prMap[s.exercise_name] = weight
    }

    res.status(201).json({ saved: savedSets.length, sets: savedSets })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save workout' })
  }
})

module.exports = router
