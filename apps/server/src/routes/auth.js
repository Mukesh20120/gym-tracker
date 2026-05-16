const { Router } = require('express')
const { registerUser, loginUser, toPublicUser } = require('../services/authService')

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, display_name } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' })
    }
    const user = await registerUser(email, password, display_name)
    const publicUser = toPublicUser(user)
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error' })
      req.session.userId = publicUser.id
      req.session.user = publicUser
      req.session.save((err2) => {
        if (err2) return res.status(500).json({ error: 'Session save failed' })
        return res.status(201).json({ user: publicUser })
      })
    })
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: err.message })
    }
    console.error(err)
    return res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    const user = await loginUser(email, password)
    const publicUser = toPublicUser(user)
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error' })
      req.session.userId = publicUser.id
      req.session.user = publicUser
      req.session.save((err2) => {
        if (err2) return res.status(500).json({ error: 'Session save failed' })
        return res.json({ user: publicUser })
      })
    })
  } catch (err) {
    if (err.code === 'BAD_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    console.error(err)
    return res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' })
    res.clearCookie('sid')
    return res.json({ ok: true })
  })
})

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  return res.json({ user: req.session.user })
})

module.exports = router
