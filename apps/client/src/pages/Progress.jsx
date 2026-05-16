import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useAllWorkouts } from '../hooks/useAllWorkouts'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

function buildChartData(workouts, exerciseName) {
  const byDate = {}
  workouts
    .filter((w) => w.exercise_name === exerciseName)
    .forEach((w) => {
      const kg = Number(w.weight_kg) || 0
      if (!byDate[w.date] || kg > byDate[w.date].weight) {
        byDate[w.date] = { date: w.date, weight: kg }
      }
    })
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-gray-800 px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400">{label}</p>
      <p className="font-semibold text-indigo-300">{payload[0].value} kg</p>
    </div>
  )
}

export default function Progress() {
  const { workouts, loading, error } = useAllWorkouts()
  const [selected, setSelected] = useState(null)

  const exercises = useMemo(() => {
    const names = [...new Set(workouts.map((w) => w.exercise_name))]
    return names.sort()
  }, [workouts])

  const chartData = useMemo(
    () => (selected ? buildChartData(workouts, selected) : []),
    [workouts, selected]
  )

  const pr = useMemo(
    () => (chartData.length ? Math.max(...chartData.map((d) => d.weight)) : null),
    [chartData]
  )

  return (
    <div className="flex flex-col">
      <PageHeader title="Progress" />

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
            {/* Exercise selector */}
            <Card className="p-0 overflow-hidden">
              <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Select Exercise
              </p>
              <ul className="divide-y divide-gray-800">
                {exercises.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-gray-500">
                    No workout data yet — log a session first.
                  </li>
                )}
                {exercises.map((name) => {
                  const hasPR = workouts.some(
                    (w) => w.exercise_name === name && w.is_pr === true
                  )
                  return (
                    <li key={name}>
                      <button
                        onClick={() => setSelected((prev) => (prev === name ? null : name))}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                          selected === name
                            ? 'bg-indigo-500/10 text-indigo-300'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {name}
                          {hasPR && <span title="Personal Record achieved">🏆</span>}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 transition-transform ${selected === name ? 'rotate-90' : ''}`}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>

                      {/* Inline chart */}
                      {selected === name && (
                        <div className="border-t border-gray-800 bg-gray-900/50 px-4 pb-4 pt-3">
                          {chartData.length < 2 ? (
                            <p className="py-6 text-center text-sm text-gray-500">
                              {chartData.length === 0
                                ? 'No data for this exercise.'
                                : 'Need at least 2 sessions to show a trend.'}
                            </p>
                          ) : (
                            <>
                              <div className="mb-3 flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                  {chartData.length} sessions
                                </span>
                                {pr !== null && (
                                  <span className="text-xs text-yellow-400">
                                    🏆 PR: {pr} kg
                                  </span>
                                )}
                              </div>
                              <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                  <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tick={{ fill: '#6B7280', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <YAxis
                                    tick={{ fill: '#6B7280', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip content={<CustomTooltip />} />
                                  {pr !== null && (
                                    <ReferenceLine
                                      y={pr}
                                      stroke="#FBBF24"
                                      strokeDasharray="4 4"
                                      strokeWidth={1}
                                    />
                                  )}
                                  <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#6366F1"
                                    strokeWidth={2}
                                    dot={{ fill: '#6366F1', r: 3 }}
                                    activeDot={{ r: 5 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
