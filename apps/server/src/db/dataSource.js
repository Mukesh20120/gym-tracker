require('dotenv').config()
const path = require('path')
const { DataSource } = require('typeorm')
const WorkoutSet = require('./entities/WorkoutSet')
const Exercise = require('./entities/Exercise')
const Template = require('./entities/Template')
const User = require('./entities/User')

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: [WorkoutSet, Exercise, Template, User],
  migrations: [path.join(__dirname, 'migrations', '*.js')],
  migrationsTableName: 'typeorm_migrations',
})

module.exports = AppDataSource
