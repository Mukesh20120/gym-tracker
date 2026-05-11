import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllWorkouts } from '../hooks/useAllWorkouts'
import { useTemplate, todayDayName } from '../hooks/useTemplate'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const GROUP_COLOR = { Push: 'indigo', Pull: 'green', Legs: 'red' }

function toYMD(date) {
  return date.toISOString().slice(0, 10)
}

function getWeekDates() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  // Week starts Monday (index 0 = Mon … 6 = Sun)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + mondayOffset + i)
    return d
  })
}

function calcStreak(workouts) {
  const trainedDates = new Set(workouts.map((w) => w.date))
  let streak = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  // If today isn't trained yet, start counting from yesterday
  if (!trainedDates.has(toYMD(d))) d.setDate(d.getDate() - 1)
  while (trainedDates.has(toYMD(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function Dashboard() {
  const navigate = useNavigate()
  const dayName = todayDayName()
  const today = toYMD(new Date())

  const { workouts, loading: wLoading } = useAllWorkouts()
  const { template, loading: tLoading } = useTemplate()

  const todaySets = useMemo(() => workouts.filter((w) => w.date === today), [workouts, today])
  const alreadyLogged = todaySets.length > 0

  const weekDates = useMemo(() => getWeekDates(), [])
  const trainedDates = useMemo(() => new Set(workouts.map((w) => w.date)), [workouts])
  const streak = useMemo(() => calcStreak(workouts), [workouts])

  const weeklyDone = weekDates.filter((d) => trainedDates.has(toYMD(d))).length
  const weeklyTarget = 6 // PPL runs 6 days

  // Volume = sum(reps × weight_kg) for today's session
  const todayVolume = useMemo(
    () => todaySets.reduce((sum, s) => sum + (Number(s.reps) || 0) * (Number(s.weight_kg) || 0), 0),
    [todaySets]
  )

  const isLoading = wLoading || tLoading
  const isRestDay = !tLoading && !template

  return (
    <div className="flex flex-col">
      <PageHeader title="Dashboard" />

      <div className="flex flex-col gap-4 px-4 pb-6">

        {/* ── Weekly streak strip (GYM-23) ── */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">This Week</span>
            <span className="text-xs text-gray-500">{weeklyDone}/{weeklyTarget} days</span>
          </div>

          <div className="flex justify-between">
            {weekDates.map((d, i) => {
              const ymd = toYMD(d)
              const isToday = ymd === today
              const trained = trainedDates.has(ymd)
              return (
                <div key={ymd} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-600">{DAY_LETTERS[i]}</span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      trained
                        ? 'bg-indigo-500 text-white'
                        : isToday
                        ? 'border-2 border-indigo-500 text-indigo-400'
                        : 'bg-gray-800 text-gray-600'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-gray-800 pt-3">
            <span className="text-2xl font-bold text-indigo-400">{streak}</span>
            <span className="text-sm text-gray-500">day streak</span>
          </div>
        </Card>

        {/* ── Today's workout card (GYM-22) ── */}
        {isLoading ? (
          <Card className="flex items-center justify-center py-10">
            <Spinner className="h-8 w-8" />
          </Card>
        ) : isRestDay ? (
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-3xl">😴</p>
            <p className="font-semibold text-gray-300">Rest day — recover well!</p>
            <p className="text-sm text-gray-500">{dayName}</p>
          </Card>
        ) : alreadyLogged ? (
          /* Completed state */
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-100">{dayName}</p>
                <p className="text-xs text-gray-500">Today's session</p>
              </div>
              <Badge color="green">Done ✓</Badge>
            </div>

            <div className="flex gap-6 border-t border-gray-800 pt-3">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-100">
                  {[...new Set(todaySets.map((s) => s.exercise_name))].length}
                </span>
                <span className="text-xs text-gray-500">exercises</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-100">{todaySets.length}</span>
                <span className="text-xs text-gray-500">sets</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-100">
                  {todayVolume.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">kg volume</span>
              </div>
            </div>
          </Card>
        ) : (
          /* Ready-to-log state */
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-100">{dayName}</p>
                <p className="text-xs text-gray-500">
                  {template?.exercises?.length ?? 0} exercises planned
                </p>
              </div>
              <Badge color={GROUP_COLOR[template?.exercises?.[0]?.muscle_group] ?? 'gray'}>
                {template?.exercises?.[0]?.muscle_group ?? ''}
              </Badge>
            </div>

            <ul className="mb-4 space-y-1">
              {(template?.exercises ?? []).map((ex) => (
                <li key={ex.exercise_name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{ex.exercise_name}</span>
                  <span className="text-gray-600">
                    {ex.default_sets}×{ex.default_reps} @ {ex.default_weight_kg}kg
                  </span>
                </li>
              ))}
            </ul>

            <Button className="w-full" onClick={() => navigate('/log')}>
              Log Today's Workout
            </Button>
          </Card>
        )}

      </div>
    </div>
  )
}
