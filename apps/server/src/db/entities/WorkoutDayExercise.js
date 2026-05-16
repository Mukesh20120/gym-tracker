const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'WorkoutDayExercise',
  tableName: 'workout_day_exercises',
  columns: {
    id: { type: String, primary: true, generated: 'uuid' },
    workout_day_id: { type: 'uuid', nullable: false },
    sort_order: { type: Number, default: 0 },
    exercise_name: { type: String, length: 100, nullable: false },
    exercise_id: { type: String, length: 10, nullable: true },
    default_sets: { type: Number, default: 3 },
    default_reps: { type: String, length: 20, default: '8-10' },
    default_weight_kg: { type: 'decimal', precision: 6, scale: 2, default: 0 },
  },
  indices: [{ columns: ['workout_day_id'] }],
})
