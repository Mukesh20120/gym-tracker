const session = require('express-session')
const PgSession = require('connect-pg-simple')(session)
const { Pool } = require('pg')

function createSessionMiddleware() {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required')
  }

  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL })

  return session({
    name: 'sid',
    store: new PgSession({
      pool: pgPool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
      ttl: 60 * 60 * 24 * 30,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
}

module.exports = { createSessionMiddleware }
