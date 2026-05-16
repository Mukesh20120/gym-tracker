require('dotenv').config()
const express = require('express')
const cors = require('cors')
const AppDataSource = require('./db/dataSource')
const { seed } = require('./db/seed')
const { createSessionMiddleware } = require('./middleware/session')
const authRouter = require('./routes/auth')
const workoutsRouter = require('./routes/workouts')
const templatesRouter = require('./routes/templates')
const workoutDaysRouter = require('./routes/workoutDays')
const exercisesRouter = require('./routes/exercises')

const app = express()
app.set('trust proxy', 1)
const PORT = process.env.PORT || 4000

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173']

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(createSessionMiddleware())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/workouts', workoutsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/workout-days', workoutDaysRouter)
app.use('/api/exercises', exercisesRouter)

AppDataSource.initialize()
  .then(() => AppDataSource.runMigrations())
  .then(() => seed())
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
  })
