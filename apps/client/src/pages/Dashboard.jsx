import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllWorkouts } from '../hooks/useAllWorkouts'
import { useWorkoutDays } from '../hooks/useWorkoutDays'
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
  if (!trainedDates.has(toYMD(d))) d.setDate(d.getDate() - 1)
  while (trainedDates.has(toYMD(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// Given the user's days list and the last logged day name, suggest the next workout.
function suggestNextDay(days, lastDayName) {
  if (!days.length) return null
  const nonRestDays = days.filter((d) => d.exercises.length > 0)
  if (!nonRestDays.length) return null

  if (!lastDayName) return nonRestDays[0]

  const lastIdx = nonRestDays.findIndex((d) => d.name === lastDayName)
  if (lastIdx === -1) return nonRestDays[0]
  return nonRestDays[(lastIdx + 1) % nonRestDays.length]
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const today = toYMD(new Date())

  const { workouts, loading: wLoading } = useAllWorkouts()
  const { days, loading: dLoading } = useWorkoutDays()

  const todaySets = useMemo(() => workouts.filter((w) => w.date === today), [workouts, today])
  const alreadyLogged = todaySets.length > 0

  const weekDates = useMemo(() => getWeekDates(), [])
  const trainedDates = useMemo(() => new Set(workouts.map((w) => w.date)), [workouts])
  const streak = useMemo(() => calcStreak(workouts), [workouts])

  const weeklyDone = weekDates.filter((d) => trainedDates.has(toYMD(d))).length
  const weeklyTarget = 6

  const todayVolume = useMemo(
    () => todaySets.reduce((sum, s) => sum + (Number(s.reps) || 0) * (Number(s.weight_kg) || 0), 0),
    [todaySets]
  )

  // Auto-suggest next workout based on last logged day.
  const suggestedDay = useMemo(() => {
    if (!days.length || !workouts.length) return days.find((d) => d.exercises.length > 0) ?? null
    const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date))
    const lastDayName = sorted[0]?.day_name ?? null
    return suggestNextDay(days, lastDayName)
  }, [days, workouts])

  const [selectedDay, setSelectedDay] = useState(null)

  // Sync selected day when suggestion resolves after loading.
  useEffect(() => {
    if (suggestedDay && !selectedDay) setSelectedDay(suggestedDay)
  }, [suggestedDay, selectedDay])

  const isLoading = wLoading || dLoading
  const isRestDay = selectedDay?.exercises?.length === 0

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Dashboard"
        action={
          <button
            onClick={() => navigate('/settings')}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon />
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-4 pb-6">

        {/* Weekly streak strip */}
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

        {/* Today's workout card */}
        {isLoading ? (
          <Card className="flex items-center justify-center py-10">
            <Spinner className="h-8 w-8" />
          </Card>
        ) : alreadyLogged ? (
          /* Completed state */
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-100">
                  {todaySets[0]?.day_name ?? 'Today'}
                </p>
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
          /* Workout selector + ready-to-log state */
          <Card>
            <p className="mb-3 text-sm font-semibold text-gray-400">Choose Today's Workout</p>

            {/* Horizontal day chip strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedDay?.id === day.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>

            {/* Exercise preview or rest state */}
            {selectedDay && (
              <div className="mt-4">
                {isRestDay ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <p className="text-3xl">😴</p>
                    <p className="font-semibold text-gray-300">Rest day — recover well!</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {selectedDay.exercises.length} exercises planned
                      </p>
                      <Badge color={GROUP_COLOR[selectedDay.exercises[0]?.muscle_group] ?? 'gray'}>
                        {selectedDay.exercises[0]?.muscle_group ?? 'Custom'}
                      </Badge>
                    </div>

                    <ul className="mb-4 space-y-1">
                      {selectedDay.exercises.slice(0, 5).map((ex) => (
                        <li key={ex.exercise_name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{ex.exercise_name}</span>
                          <span className="text-gray-600">
                            {ex.default_sets}×{ex.default_reps}
                          </span>
                        </li>
                      ))}
                      {selectedDay.exercises.length > 5 && (
                        <li className="text-xs text-gray-600">
                          +{selectedDay.exercises.length - 5} more
                        </li>
                      )}
                    </ul>

                    <Button
                      className="w-full"
                      onClick={() => navigate('/log', { state: { day: selectedDay } })}
                    >
                      Start Workout
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
        )}

      </div>
    </div>
  )
}
