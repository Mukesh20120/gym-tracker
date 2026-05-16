const AppDataSource = require('./dataSource')

const exercises = [
  { id: 'e1',  name: 'Squat',                 muscle_group: 'Legs', equipment: 'Barbell' },
  { id: 'e2',  name: 'Romanian Deadlift',      muscle_group: 'Legs', equipment: 'Barbell' },
  { id: 'e3',  name: 'Leg Press',              muscle_group: 'Legs', equipment: 'Machine' },
  { id: 'e4',  name: 'Leg Curl',               muscle_group: 'Legs', equipment: 'Machine' },
  { id: 'e5',  name: 'Calf Raise',             muscle_group: 'Legs', equipment: 'Machine' },
  { id: 'e6',  name: 'Leg Extension',          muscle_group: 'Legs', equipment: 'Machine' },
  { id: 'e7',  name: 'Bench Press',            muscle_group: 'Push', equipment: 'Barbell' },
  { id: 'e8',  name: 'Overhead Press',         muscle_group: 'Push', equipment: 'Barbell' },
  { id: 'e9',  name: 'Incline Dumbbell Press', muscle_group: 'Push', equipment: 'Dumbbell' },
  { id: 'e10', name: 'Lateral Raise',          muscle_group: 'Push', equipment: 'Dumbbell' },
  { id: 'e11', name: 'Tricep Pushdown',        muscle_group: 'Push', equipment: 'Cable' },
  { id: 'e12', name: 'Chest Fly',              muscle_group: 'Push', equipment: 'Cable' },
  { id: 'e13', name: 'Deadlift',               muscle_group: 'Pull', equipment: 'Barbell' },
  { id: 'e14', name: 'Pull Up',                muscle_group: 'Pull', equipment: 'Bodyweight' },
  { id: 'e15', name: 'Barbell Row',            muscle_group: 'Pull', equipment: 'Barbell' },
  { id: 'e16', name: 'Face Pull',              muscle_group: 'Pull', equipment: 'Cable' },
  { id: 'e17', name: 'Bicep Curl',             muscle_group: 'Pull', equipment: 'Dumbbell' },
  { id: 'e18', name: 'Hammer Curl',            muscle_group: 'Pull', equipment: 'Dumbbell' },
]

const legExercises = [
  { exercise_name: 'Squat',             default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
  { exercise_name: 'Romanian Deadlift', default_sets: 3, default_reps: '10-12', default_weight_kg: 30 },
  { exercise_name: 'Leg Press',         default_sets: 3, default_reps: '12-15', default_weight_kg: 60 },
  { exercise_name: 'Leg Curl',          default_sets: 3, default_reps: '12-15', default_weight_kg: 25 },
  { exercise_name: 'Calf Raise',        default_sets: 4, default_reps: '15-20', default_weight_kg: 40 },
  { exercise_name: 'Leg Extension',     default_sets: 3, default_reps: '12-15', default_weight_kg: 30 },
]

const pushExercises = [
  { exercise_name: 'Bench Press',            default_sets: 4, default_reps: '6-8',   default_weight_kg: 40 },
  { exercise_name: 'Overhead Press',         default_sets: 3, default_reps: '8-10',  default_weight_kg: 25 },
  { exercise_name: 'Incline Dumbbell Press', default_sets: 3, default_reps: '10-12', default_weight_kg: 18 },
  { exercise_name: 'Lateral Raise',          default_sets: 3, default_reps: '12-15', default_weight_kg: 8  },
  { exercise_name: 'Tricep Pushdown',        default_sets: 3, default_reps: '12-15', default_weight_kg: 15 },
  { exercise_name: 'Chest Fly',              default_sets: 3, default_reps: '12-15', default_weight_kg: 10 },
]

const pullExercises = [
  { exercise_name: 'Deadlift',     default_sets: 3, default_reps: '5-6',   default_weight_kg: 50 },
  { exercise_name: 'Pull Up',      default_sets: 3, default_reps: '6-8',   default_weight_kg: 0  },
  { exercise_name: 'Barbell Row',  default_sets: 3, default_reps: '8-10',  default_weight_kg: 35 },
  { exercise_name: 'Face Pull',    default_sets: 3, default_reps: '15-20', default_weight_kg: 10 },
  { exercise_name: 'Bicep Curl',   default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },
  { exercise_name: 'Hammer Curl',  default_sets: 3, default_reps: '10-12', default_weight_kg: 12 },
]

// 6-day PPL: Mon/Thu=Legs, Tue/Fri=Push, Wed/Sat=Pull
const templates = [
  ...['Monday',    'Thursday' ].flatMap((d) => legExercises.map( (r) => ({ day_name: d, ...r }))),
  ...['Tuesday',   'Friday'   ].flatMap((d) => pushExercises.map((r) => ({ day_name: d, ...r }))),
  ...['Wednesday', 'Saturday' ].flatMap((d) => pullExercises.map((r) => ({ day_name: d, ...r }))),
]

async function seed() {
  const exerciseRepo = AppDataSource.getRepository('Exercise')
  const templateRepo = AppDataSource.getRepository('Template')

  const existingCount = await exerciseRepo.count()
  if (existingCount > 0) return

  try {
    await exerciseRepo.insert(exercises)
    await templateRepo.insert(templates)
    console.log('Database seeded.')
  } catch (err) {
    if (err.code === '23505') return // another instance already seeded
    throw err
  }
}

module.exports = { seed }
