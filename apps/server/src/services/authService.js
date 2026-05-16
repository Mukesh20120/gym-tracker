const bcrypt = require('bcrypt')
const AppDataSource = require('../db/dataSource')

const SALT_ROUNDS = 12

function userRepo() {
  return AppDataSource.getRepository('User')
}

async function registerUser(email, password, displayName) {
  const repo = userRepo()
  const existing = await repo.findOneBy({ email: email.toLowerCase() })
  if (existing) {
    const err = new Error('Email already registered')
    err.code = 'EMAIL_TAKEN'
    throw err
  }
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = repo.create({
    email: email.toLowerCase(),
    password_hash,
    display_name: displayName || null,
  })
  return repo.save(user)
}

async function loginUser(email, password) {
  const user = await userRepo().findOneBy({ email: email.toLowerCase() })
  if (!user) {
    const err = new Error('Invalid credentials')
    err.code = 'BAD_CREDENTIALS'
    throw err
  }
  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    const err = new Error('Invalid credentials')
    err.code = 'BAD_CREDENTIALS'
    throw err
  }
  return user
}

async function getUserById(id) {
  return userRepo().findOneBy({ id })
}

function toPublicUser(user) {
  return { id: user.id, email: user.email, display_name: user.display_name }
}

module.exports = { registerUser, loginUser, getUserById, toPublicUser }
