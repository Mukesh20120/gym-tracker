import Badge from './Badge'

/**
 * @param {{ name: string, muscleGroup?: string, isPR?: boolean, children?: React.ReactNode }} props
 */
export default function ExerciseRow({ name, muscleGroup, isPR, children }) {
  const groupColor = { Push: 'indigo', Pull: 'green', Legs: 'red' }[muscleGroup] ?? 'gray'

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-100">{name}</span>
          {isPR && <span title="Personal Record">🏆</span>}
        </div>
        {muscleGroup && <Badge color={groupColor}>{muscleGroup}</Badge>}
      </div>
      {children}
    </div>
  )
}
