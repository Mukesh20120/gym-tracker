const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'WorkoutSet',
  tableName: 'workout_sets',
  columns: {
    id: { type: String, primary: true, generated: 'uuid' },
    date: { type: String, length: 10 },
    day_name: { type: String, length: 20 },
    exercise_name: { type: String, length: 100 },
    set_number: { type: Number },
    reps: { type: Number },
    weight_kg: { type: 'decimal', precision: 6, scale: 2, default: 0 },
    notes: { type: String, length: 500, nullable: true, default: '' },
    is_pr: { type: Boolean, default: false },
    created_at: { type: Date, createDate: true },
    user_id: { type: String, length: 36, nullable: true },
  },
})
