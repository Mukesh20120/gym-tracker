const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: String,
      primary: true,
      generated: 'uuid',
    },
    email: {
      type: String,
      length: 255,
      unique: true,
      nullable: false,
    },
    password_hash: {
      type: String,
      length: 255,
      nullable: false,
    },
    display_name: {
      type: String,
      length: 100,
      nullable: true,
    },
    created_at: {
      type: Date,
      createDate: true,
    },
    updated_at: {
      type: Date,
      updateDate: true,
    },
  },
})
