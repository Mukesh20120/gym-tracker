const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'WorkoutDay',
  tableName: 'workout_days',
  columns: {
    id: { type: String, primary: true, generated: 'uuid' },
    user_id: { type: String, length: 36, nullable: false },
    name: { type: String, length: 50, nullable: false },
    is_default: { type: Boolean, default: false },
    created_at: { type: Date, createDate: true },
    updated_at: { type: Date, updateDate: true },
  },
  uniques: [{ columns: ['user_id', 'name'] }],
  indices: [{ columns: ['user_id'] }],
})
