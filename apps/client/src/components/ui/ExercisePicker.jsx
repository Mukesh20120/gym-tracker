import { useState } from 'react'
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog'
import Badge from './Badge'
import Button from './Button'
import Spinner from './Spinner'

const GROUP_COLOR = { Push: 'indigo', Pull: 'green', Legs: 'red' }

/**
 * Two-tab panel for adding exercises to a workout day.
 * @param {{ onAdd: (exercise: object) => void, existingNames: string[] }} props
 */
export default function ExercisePicker({ onAdd, existingNames = [] }) {
  const [activeTab, setActiveTab] = useState('catalog')
  const [customName, setCustomName] = useState('')
  const { exercises, loading } = useExerciseCatalog()

  function handleCatalogAdd(ex) {
    onAdd({
      exercise_name: ex.name,
      exercise_id: ex.id,
      default_sets: 3,
      default_reps: '8-10',
      default_weight_kg: 0,
      muscle_group: ex.muscle_group,
    })
  }

  function handleCustomAdd() {
    const name = customName.trim()
    if (!name) return
    onAdd({
      exercise_name: name,
      exercise_id: null,
      default_sets: 3,
      default_reps: '8-10',
      default_weight_kg: 0,
      muscle_group: null,
    })
    setCustomName('')
  }

  return (
    <div className="rounded-2xl bg-gray-900 p-4">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 mb-4">
        {['catalog', 'custom'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'catalog' ? 'From Catalog' : 'Custom'}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' ? (
        loading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {exercises.map((ex) => {
              const alreadyAdded = existingNames.includes(ex.name)
              return (
                <div
                  key={ex.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                    alreadyAdded ? 'opacity-40' : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-200">{ex.name}</span>
                    <Badge color={GROUP_COLOR[ex.muscle_group] ?? 'gray'}>{ex.muscle_group}</Badge>
                  </div>
                  <button
                    onClick={() => !alreadyAdded && handleCatalogAdd(ex)}
                    disabled={alreadyAdded}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white disabled:cursor-not-allowed disabled:bg-gray-700 hover:bg-indigo-400 transition-colors"
                    aria-label={alreadyAdded ? 'Already added' : `Add ${ex.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
            placeholder="Exercise name…"
            className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button onClick={handleCustomAdd} disabled={!customName.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
