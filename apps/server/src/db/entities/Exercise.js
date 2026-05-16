const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'Exercise',
  tableName: 'exercises',
  columns: {
    id: { type: String, length: 10, primary: true },
    name: { type: String, length: 100, unique: true },
    muscle_group: { type: String, length: 20 },
    equipment: { type: String, length: 20 },
  },
})
