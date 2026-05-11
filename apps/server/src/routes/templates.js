const { Router } = require('express')
const { getRows } = require('../services/sheetsService')

const router = Router()

// GET /api/templates/:day — exercise template for a given day name
router.get('/:day', async (req, res) => {
  try {
    const rows = await getRows('Templates')
    // Case-insensitive match
    const dayName = req.params.day.charAt(0).toUpperCase() + req.params.day.slice(1).toLowerCase()
    const exercises = rows.filter((r) => r.day_name === dayName)

    if (exercises.length === 0) {
      return res.status(404).json({ error: `No template found for day: ${dayName}` })
    }

    res.json({ day_name: dayName, exercises })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch template' })
  }
})

module.exports = router
