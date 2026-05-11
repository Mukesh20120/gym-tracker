import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useAllWorkouts } from '../hooks/useAllWorkouts'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

const DAY_GROUP = {
  Monday: 'Legs', Tuesday: 'Push', Wednesday: 'Pull',
  Thursday: 'Legs', Friday: 'Push', Saturday: 'Pull', Sunday: 'Rest',
}
const GROUP_BG    = { Push: 'bg-indigo-500',  Pull: 'bg-green-500',  Legs: 'bg-red-500'  }
const GROUP_TEXT  = { Push: 'text-indigo-400', Pull: 'text-green-400', Legs: 'text-red-400' }
const GROUP_CHART = { Push: '#6366F1',         Pull: '#22C55E',        Legs: '#EF4444'     }

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateToYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function cellYMD(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function groupByDate(workouts) {
  const map = {}
  workouts.forEach((w) => {
    if (!map[w.date]) map[w.date] = { date: w.date, day_name: w.day_name, sets: [] }
    map[w.date].sets.push(w)
  })
  return map
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  let offset = firstDay.getDay() - 1
  if (offset < 0) offset = 6
  const cells = Array(offset).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function getMondayOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

function buildWeeklyVolume(workouts, numWeeks = 8) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weeks = []
  for (let i = numWeeks - 1; i >= 0; i--) {
    const mon = getMondayOfWeek(new Date(today.getTime() - i * 7 * 86400000))
    const sun = new Date(mon.getTime() + 6 * 86400000)
    weeks.push({
      week: `${String(mon.getMonth() + 1).padStart(2, '0')}/${String(mon.getDate()).padStart(2, '0')}`,
      monDate: dateToYMD(mon),
      sunDate: dateToYMD(sun),
      Push: 0, Pull: 0, Legs: 0,
    })
  }
  workouts.forEach((w) => {
    const group = DAY_GROUP[w.day_name]
    if (!group || group === 'Rest') return
    const vol = (Number(w.reps) || 0) * (Number(w.weight_kg) || 0)
    const entry = weeks.find((wk) => w.date >= wk.monDate && w.date <= wk.sunDate)
    if (entry) entry[group] += vol
  })
  return weeks.map(({ week, Push, Pull, Legs }) => ({
    week,
    Push: Math.round(Push),
    Pull: Math.round(Pull),
    Legs: Math.round(Legs),
  }))
}

function buildHeatmapWeeks(workouts) {
  const trained = new Set(workouts.map((w) => w.date))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = getMondayOfWeek(new Date(today.getTime() - 51 * 7 * 86400000))
  const weeks = []
  const cur = new Date(start)
  for (let w = 0; w < 52; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const ymd = dateToYMD(cur)
      week.push({ date: ymd, trained: trained.has(ymd), future: cur > today })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

// ── CalendarCard (GYM-27) ─────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_HEADERS = ['M','T','W','T','F','S','S']

function CalendarCard({ calMonth, setCalMonth, sessionsByDate, selectedDate, setSelectedDate, todayStr }) {
  const { year, month } = calMonth
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  function prevMonth() {
    setSelectedDate(null)
    setCalMonth((prev) =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    )
  }
  function nextMonth() {
    if (isCurrentMonth) return
    setSelectedDate(null)
    setCalMonth((prev) =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    )
  }

  return (
    <Card className="p-0 overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <button
          onClick={prevMonth}
          className="p-1 text-gray-400 transition-colors hover:text-gray-200"
          aria-label="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-200">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-1 text-gray-400 transition-colors hover:text-gray-200 disabled:opacity-30"
          aria-label="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="py-2 text-center text-[10px] font-medium text-gray-600">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const ymd = cellYMD(year, month, day)
          const session = sessionsByDate[ymd]
          const group = session ? DAY_GROUP[session.day_name] : null
          const isToday = ymd === todayStr
          const isSelected = ymd === selectedDate

          return (
            <button
              key={i}
              onClick={() => session ? setSelectedDate((prev) => prev === ymd ? null : ymd) : undefined}
              disabled={!session}
              className={`relative flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium transition-all
                ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}
                ${session && group && GROUP_BG[group]
                  ? `${GROUP_BG[group]} text-white`
                  : isToday
                  ? 'border border-gray-600 text-gray-300'
                  : 'cursor-default text-gray-600'
                }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 border-t border-gray-800 px-4 py-3">
        {Object.entries(GROUP_BG).map(([group, bg]) => (
          <div key={group} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${bg}`} />
            <span className="text-xs text-gray-500">{group}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── SessionDetail (GYM-28) ────────────────────────────────────────────────────

function SessionDetail({ session }) {
  const byExercise = useMemo(() => {
    const map = {}
    session.sets.forEach((s) => {
      if (!map[s.exercise_name]) map[s.exercise_name] = []
      map[s.exercise_name].push(s)
    })
    return map
  }, [session.sets])

  const totalVolume = useMemo(
    () => session.sets.reduce((sum, s) => sum + (Number(s.reps) || 0) * (Number(s.weight_kg) || 0), 0),
    [session.sets]
  )

  const group = DAY_GROUP[session.day_name]

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-100">{session.date}</p>
          <p className={`text-xs font-medium ${GROUP_TEXT[group] ?? 'text-gray-400'}`}>
            {session.day_name} · {group}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-100">{totalVolume.toLocaleString()} kg</p>
          <p className="text-xs text-gray-500">total volume</p>
        </div>
      </div>

      <ul className="divide-y divide-gray-800">
        {Object.entries(byExercise).map(([name, sets]) => {
          const hasPR = sets.some((s) => s.is_pr === 'true')
          return (
            <li key={name} className="py-2">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-200">{name}</span>
                {hasPR && <span title="Personal Record">🏆</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {sets.map((s, i) => (
                  <span key={i} className="rounded-lg bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                    {s.reps}×{s.weight_kg}kg
                  </span>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

// ── HeatmapCard (GYM-30) ──────────────────────────────────────────────────────

function HeatmapCard({ heatmapWeeks }) {
  const monthLabels = useMemo(() => {
    const labels = []
    heatmapWeeks.forEach((week, wi) => {
      const d = new Date(week[0].date + 'T00:00:00')
      if (d.getDate() <= 7) {
        labels.push({ wi, label: d.toLocaleString('default', { month: 'short' }) })
      }
    })
    return labels
  }, [heatmapWeeks])

  const totalTrained = useMemo(
    () => heatmapWeeks.flat().filter((c) => c.trained).length,
    [heatmapWeeks]
  )

  return (
    <Card>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Consistency — Last 52 Weeks
      </p>

      {/* Month labels */}
      <div className="relative mb-1 h-4 overflow-hidden">
        {monthLabels.map(({ wi, label }) => (
          <span
            key={wi}
            className="absolute text-[9px] text-gray-600"
            style={{ left: `${(wi / 52) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid — 52 columns × 7 rows */}
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {heatmapWeeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={cell.trained ? `Trained ${cell.date}` : cell.date}
                className={`h-[9px] w-[9px] rounded-sm transition-colors ${
                  cell.future ? 'bg-transparent'
                  : cell.trained ? 'bg-indigo-500'
                  : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="mt-2 text-right text-[10px] text-gray-600">
        {totalTrained} training days
      </p>
    </Card>
  )
}

// ── WeeklyVolumeCard (GYM-29) ─────────────────────────────────────────────────

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-gray-800 px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-gray-400">w/c {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value.toLocaleString()} kg
        </p>
      ))}
    </div>
  )
}

function WeeklyVolumeCard({ weeklyVolume }) {
  const hasData = weeklyVolume.some((w) => w.Push + w.Pull + w.Legs > 0)

  return (
    <Card>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Weekly Volume by Muscle Group
      </p>
      {!hasData ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No data yet — log some sessions first.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyVolume} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#6B7280', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', color: '#9CA3AF', paddingTop: '8px' }}
            />
            <Bar dataKey="Legs" stackId="vol" fill={GROUP_CHART.Legs} />
            <Bar dataKey="Pull" stackId="vol" fill={GROUP_CHART.Pull} />
            <Bar dataKey="Push" stackId="vol" fill={GROUP_CHART.Push} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function History() {
  const { workouts, loading, error } = useAllWorkouts()
  const [selectedDate, setSelectedDate] = useState(null)
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const todayStr     = useMemo(() => dateToYMD(new Date()), [])
  const sessionsByDate = useMemo(() => groupByDate(workouts), [workouts])
  const weeklyVolume   = useMemo(() => buildWeeklyVolume(workouts), [workouts])
  const heatmapWeeks   = useMemo(() => buildHeatmapWeeks(workouts), [workouts])

  return (
    <div className="flex flex-col">
      <PageHeader title="History" />

      <div className="flex flex-col gap-4 px-4 pb-6">
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner className="h-10 w-10" />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* GYM-27: Calendar */}
            <CalendarCard
              calMonth={calMonth}
              setCalMonth={setCalMonth}
              sessionsByDate={sessionsByDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              todayStr={todayStr}
            />

            {/* GYM-28: Session detail — shown when a trained day is selected */}
            {selectedDate && sessionsByDate[selectedDate] && (
              <SessionDetail session={sessionsByDate[selectedDate]} />
            )}

            {/* GYM-30: Consistency heatmap */}
            <HeatmapCard heatmapWeeks={heatmapWeeks} />

            {/* GYM-29: Weekly volume stacked bar */}
            <WeeklyVolumeCard weeklyVolume={weeklyVolume} />
          </>
        )}
      </div>
    </div>
  )
}
