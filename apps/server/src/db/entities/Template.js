const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'Template',
  tableName: 'templates',
  columns: {
    id: { type: Number, primary: true, generated: 'increment' },
    day_name: { type: String, length: 20 },
    exercise_name: { type: String, length: 100 },
    default_sets: { type: Number },
    default_reps: { type: String, length: 20 },
    default_weight_kg: { type: 'decimal', precision: 6, scale: 2, default: 0 },
  },
})
