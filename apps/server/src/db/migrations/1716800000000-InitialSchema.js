class InitialSchema1716800000000 {
  name = 'InitialSchema1716800000000'

  async up(queryRunner) {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercises" (
        "id"           character varying(10)  NOT NULL,
        "name"         character varying(100) NOT NULL,
        "muscle_group" character varying(20)  NOT NULL,
        "equipment"    character varying(20)  NOT NULL,
        CONSTRAINT "PK_exercises"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exercises_name" UNIQUE ("name")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "templates" (
        "id"                SERIAL                 NOT NULL,
        "day_name"          character varying(20)  NOT NULL,
        "exercise_name"     character varying(100) NOT NULL,
        "default_sets"      integer                NOT NULL,
        "default_reps"      character varying(20)  NOT NULL,
        "default_weight_kg" numeric(6,2)           NOT NULL DEFAULT '0',
        CONSTRAINT "PK_templates" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "email"         character varying(255)   NOT NULL,
        "password_hash" character varying(255)   NOT NULL,
        "display_name"  character varying(100),
        "created_at"    TIMESTAMP                NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP                NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email"  UNIQUE ("email")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workout_sets" (
        "id"            uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "date"          character varying(10)    NOT NULL,
        "day_name"      character varying(20)    NOT NULL,
        "exercise_name" character varying(100)   NOT NULL,
        "set_number"    integer                  NOT NULL,
        "reps"          integer                  NOT NULL,
        "weight_kg"     numeric(6,2)             NOT NULL DEFAULT '0',
        "notes"         character varying(500)            DEFAULT '',
        "is_pr"         boolean                  NOT NULL DEFAULT false,
        "created_at"    TIMESTAMP                NOT NULL DEFAULT now(),
        "user_id"       character varying(36),
        CONSTRAINT "PK_workout_sets" PRIMARY KEY ("id")
      )
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE "workout_sets"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TABLE "templates"`)
    await queryRunner.query(`DROP TABLE "exercises"`)
  }
}

module.exports = InitialSchema1716800000000
