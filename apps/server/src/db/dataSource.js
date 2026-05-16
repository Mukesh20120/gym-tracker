require('dotenv').config()
const { DataSource } = require('typeorm')
const WorkoutSet = require('./entities/WorkoutSet')
const Exercise = require('./entities/Exercise')
const Template = require('./entities/Template')
const User = require('./entities/User')

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [WorkoutSet, Exercise, Template, User],
})

module.exports = AppDataSource
