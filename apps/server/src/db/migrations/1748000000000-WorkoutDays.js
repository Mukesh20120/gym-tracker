class WorkoutDays1748000000000 {
  name = 'WorkoutDays1748000000000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workout_days" (
        "id"         uuid                  NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    character varying(36) NOT NULL,
        "name"       character varying(50) NOT NULL,
        "is_default" boolean               NOT NULL DEFAULT false,
        "created_at" TIMESTAMP             NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_days"           PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workout_days_user_name" UNIQUE ("user_id", "name")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workout_days_user_id" ON "workout_days"("user_id")
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workout_day_exercises" (
        "id"                uuid                   NOT NULL DEFAULT uuid_generate_v4(),
        "workout_day_id"    uuid                   NOT NULL,
        "sort_order"        integer                NOT NULL DEFAULT 0,
        "exercise_name"     character varying(100) NOT NULL,
        "exercise_id"       character varying(10),
        "default_sets"      integer                NOT NULL DEFAULT 3,
        "default_reps"      character varying(20)  NOT NULL DEFAULT '8-10',
        "default_weight_kg" numeric(6,2)           NOT NULL DEFAULT 0,
        CONSTRAINT "PK_workout_day_exercises" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workout_day_exercises_day"
          FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workout_day_exercises_exercise"
          FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE SET NULL
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workout_day_exercises_day_id"
        ON "workout_day_exercises"("workout_day_id")
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "workout_day_exercises"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "workout_days"`)
  }
}

module.exports = WorkoutDays1748000000000
