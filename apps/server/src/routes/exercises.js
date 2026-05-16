const { Router } = require('express')
const { requireAuth } = require('../middleware/requireAuth')
const { getAllExercises } = require('../services/dbService')

const router = Router()
router.use(requireAuth)

// GET /api/exercises — return the full exercise catalog
router.get('/', async (_req, res) => {
  try {
    const exercises = await getAllExercises()
    res.json(exercises)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch exercises' })
  }
})

module.exports = router
