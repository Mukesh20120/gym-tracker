/**
 * One-time setup: creates Workouts, Exercises, and Templates tabs with headers,
 * then seeds Exercises and Templates with the 6-day PPL routine.
 *
 * Run from /apps/server:  node scripts/setupSheet.js
 */
require('dotenv').config()
const { ensureTab, writeSheet } = require('../src/services/sheetsService')

// ── Schema ────────────────────────────────────────────────────────────────────

const WORKOUTS_HEADERS = [
  'id', 'date', 'day_name', 'exercise_name',
  'set_number', 'reps', 'weight_kg', 'notes', 'is_pr', 'created_at',
]

const EXERCISES_HEADERS = ['id', 'name', 'muscle_group', 'equipment']

const TEMPLATES_HEADERS = [
  'day_name', 'exercise_name', 'default_sets', 'default_reps', 'default_weight_kg',
]

// ── Seed data ─────────────────────────────────────────────────────────────────

const exercises = [
  // Legs
  { id: 'e1',  name: 'Squat',                  muscle_group: 'Legs',  equipment: 'Barbell' },
  { id: 'e2',  name: 'Romanian Deadlift',       muscle_group: 'Legs',  equipment: 'Barbell' },
  { id: 'e3',  name: 'Leg Press',               muscle_group: 'Legs',  equipment: 'Machine' },
  { id: 'e4',  name: 'Leg Curl',                muscle_group: 'Legs',  equipment: 'Machine' },
  { id: 'e5',  name: 'Calf Raise',              muscle_group: 'Legs',  equipment: 'Machine' },
  { id: 'e6',  name: 'Leg Extension',           muscle_group: 'Legs',  equipment: 'Machine' },
  // Push
  { id: 'e7',  name: 'Bench Press',             muscle_group: 'Push',  equipment: 'Barbell' },
  { id: 'e8',  name: 'Overhead Press',          muscle_group: 'Push',  equipment: 'Barbell' },
  { id: 'e9',  name: 'Incline Dumbbell Press',  muscle_group: 'Push',  equipment: 'Dumbbell' },
  { id: 'e10', name: 'Lateral Raise',           muscle_group: 'Push',  equipment: 'Dumbbell' },
  { id: 'e11', name: 'Tricep Pushdown',         muscle_group: 'Push',  equipment: 'Cable' },
  { id: 'e12', name: 'Chest Fly',               muscle_group: 'Push',  equipment: 'Cable' },
  // Pull
  { id: 'e13', name: 'Deadlift',                muscle_group: 'Pull',  equipment: 'Barbell' },
  { id: 'e14', name: 'Pull Up',                 muscle_group: 'Pull',  equipment: 'Bodyweight' },
  { id: 'e15', name: 'Barbell Row',             muscle_group: 'Pull',  equipment: 'Barbell' },
  { id: 'e16', name: 'Face Pull',               muscle_group: 'Pull',  equipment: 'Cable' },
  { id: 'e17', name: 'Bicep Curl',              muscle_group: 'Pull',  equipment: 'Dumbbell' },
  { id: 'e18', name: 'Hammer Curl',             muscle_group: 'Pull',  equipment: 'Dumbbell' },
]

// 6-day PPL: Mon Legs · Tue Push · Wed Pull · Thu Legs · Fri Push · Sat Pull
const templates = [
  // Monday — Legs
  { day_name: 'Monday', exercise_name: 'Squat',                  default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
  { day_name: 'Monday', exercise_name: 'Romanian Deadlift',       default_sets: 3, default_reps: '10-12', default_weight_kg: 30 },
  { day_name: 'Monday', exercise_name: 'Leg Press',               default_sets: 3, default_reps: '12-15', default_weight_kg: 60 },
  { day_name: 'Monday', exercise_name: 'Leg Curl',                default_sets: 3, default_reps: '12-15', default_weight_kg: 25 },
  { day_name: 'Monday', exercise_name: 'Calf Raise',              default_sets: 4, default_reps: '15-20', default_weight_kg: 40 },
  { day_name: 'Monday', exercise_name: 'Leg Extension',           default_sets: 3, default_reps: '12-15', default_weight_kg: 30 },

  // Tuesday — Push
  { day_name: 'Tuesday', exercise_name: 'Bench Press',            default_sets: 4, default_reps: '6-8',   default_weight_kg: 40 },
  { day_name: 'Tuesday', exercise_name: 'Overhead Press',         default_sets: 3, default_reps: '8-10',  default_weight_kg: 25 },
  { day_name: 'Tuesday', exercise_name: 'Incline Dumbbell Press', default_sets: 3, default_reps: '10-12', default_weight_kg: 18 },
  { day_name: 'Tuesday', exercise_name: 'Lateral Raise',          default_sets: 3, default_reps: '12-15', default_weight_kg: 8  },
  { day_name: 'Tuesday', exercise_name: 'Tricep Pushdown',        default_sets: 3, default_reps: '12-15', default_weight_kg: 15 },
  { day_name: 'Tuesday', exercise_name: 'Chest Fly',              default_sets: 3, default_reps: '12-15', default_weight_kg: 10 },

  // Wednesday — Pull
  { day_name: 'Wednesday', exercise_name: 'Deadlift',             default_sets: 3, default_reps: '5-6',   default_weight_kg: 50 },
  { day_name: 'Wednesday', exercise_name: 'Pull Up',              default_sets: 3, default_reps: '6-8',   default_weight_kg: 0  },
  { day_name: 'Wednesday', exercise_name: 'Barbell Row',          default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
  { day_name: 'Wednesday', exercise_name: 'Face Pull',            default_sets: 3, default_reps: '15-20', default_weight_kg: 10 },
  { day_name: 'Wednesday', exercise_name: 'Bicep Curl',           default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },
  { day_name: 'Wednesday', exercise_name: 'Hammer Curl',          default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },

  // Thursday — Legs
  { day_name: 'Thursday', exercise_name: 'Squat',                 default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
  { day_name: 'Thursday', exercise_name: 'Romanian Deadlift',     default_sets: 3, default_reps: '10-12', default_weight_kg: 30 },
  { day_name: 'Thursday', exercise_name: 'Leg Press',             default_sets: 3, default_reps: '12-15', default_weight_kg: 60 },
  { day_name: 'Thursday', exercise_name: 'Leg Curl',              default_sets: 3, default_reps: '12-15', default_weight_kg: 25 },
  { day_name: 'Thursday', exercise_name: 'Calf Raise',            default_sets: 4, default_reps: '15-20', default_weight_kg: 40 },
  { day_name: 'Thursday', exercise_name: 'Leg Extension',         default_sets: 3, default_reps: '12-15', default_weight_kg: 30 },

  // Friday — Push
  { day_name: 'Friday', exercise_name: 'Bench Press',             default_sets: 4, default_reps: '6-8',   default_weight_kg: 40 },
  { day_name: 'Friday', exercise_name: 'Overhead Press',          default_sets: 3, default_reps: '8-10',  default_weight_kg: 25 },
  { day_name: 'Friday', exercise_name: 'Incline Dumbbell Press',  default_sets: 3, default_reps: '10-12', default_weight_kg: 18 },
  { day_name: 'Friday', exercise_name: 'Lateral Raise',           default_sets: 3, default_reps: '12-15', default_weight_kg: 8  },
  { day_name: 'Friday', exercise_name: 'Tricep Pushdown',         default_sets: 3, default_reps: '12-15', default_weight_kg: 15 },
  { day_name: 'Friday', exercise_name: 'Chest Fly',               default_sets: 3, default_reps: '12-15', default_weight_kg: 10 },

  // Saturday — Pull
  { day_name: 'Saturday', exercise_name: 'Deadlift',              default_sets: 3, default_reps: '5-6',   default_weight_kg: 50 },
  { day_name: 'Saturday', exercise_name: 'Pull Up',               default_sets: 3, default_reps: '6-8',   default_weight_kg: 0  },
  { day_name: 'Saturday', exercise_name: 'Barbell Row',           default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
  { day_name: 'Saturday', exercise_name: 'Face Pull',             default_sets: 3, default_reps: '15-20', default_weight_kg: 10 },
  { day_name: 'Saturday', exercise_name: 'Bicep Curl',            default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },
  { day_name: 'Saturday', exercise_name: 'Hammer Curl',           default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },
]

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Creating tabs…')
  await ensureTab('Workouts')
  await ensureTab('Exercises')
  await ensureTab('Templates')
  console.log('Tabs ready.')

  console.log('Writing Workouts headers…')
  await writeSheet('Workouts', WORKOUTS_HEADERS, [])

  console.log('Writing Exercises…')
  await writeSheet('Exercises', EXERCISES_HEADERS, exercises)

  console.log('Writing Templates…')
  await writeSheet('Templates', TEMPLATES_HEADERS, templates)

  console.log('Done! Sheet is ready.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
