require('dotenv').config()
const express = require('express')
const cors = require('cors')
const workoutsRouter = require('./routes/workouts')
const templatesRouter = require('./routes/templates')

const app = express()
const PORT = process.env.PORT || 4000

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173']

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/workouts', workoutsRouter)
app.use('/api/templates', templatesRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
