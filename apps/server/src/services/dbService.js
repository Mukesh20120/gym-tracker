const AppDataSource = require('../db/dataSource')

function workoutRepo() {
  return AppDataSource.getRepository('WorkoutSet')
}

function exerciseRepo() {
  return AppDataSource.getRepository('Exercise')
}

function templateRepo() {
  return AppDataSource.getRepository('Template')
}

async function getAllWorkouts(userId) {
  return workoutRepo().find({ where: { user_id: userId }, order: { created_at: 'ASC' } })
}

async function getWorkoutsByDate(date, userId) {
  return workoutRepo().findBy({ date, user_id: userId })
}

async function saveWorkoutSets(rows) {
  return workoutRepo().save(rows)
}

async function getMaxWeightPerExercise(userId) {
  const results = await workoutRepo()
    .createQueryBuilder('w')
    .select('w.exercise_name', 'exercise_name')
    .addSelect('MAX(CAST(w.weight_kg AS DECIMAL))', 'max_weight')
    .where('w.user_id = :userId', { userId })
    .groupBy('w.exercise_name')
    .getRawMany()

  return Object.fromEntries(
    results.map((r) => [r.exercise_name, r.max_weight != null ? parseFloat(r.max_weight) : 0])
  )
}

async function getAllExercises() {
  return exerciseRepo().find()
}

async function getTemplatesByDay(dayName) {
  return templateRepo().findBy({ day_name: dayName })
}

module.exports = {
  getAllWorkouts,
  getWorkoutsByDate,
  saveWorkoutSets,
  getMaxWeightPerExercise,
  getAllExercises,
  getTemplatesByDay,
}
