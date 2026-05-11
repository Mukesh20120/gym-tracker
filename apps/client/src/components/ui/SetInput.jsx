/**
 * Inline weight + reps input for a single set.
 * @param {{ setNumber: number, reps: string, weight: string, onChange: (field: string, value: string) => void }} props
 */
export default function SetInput({ setNumber, reps, weight, onChange }) {
  const numericOnly = (e) => {
    if (!/[\d.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
      e.preventDefault()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center text-xs text-gray-500">{setNumber}</span>

      <div className="flex flex-1 gap-2">
        <label className="flex flex-1 flex-col gap-0.5">
          <span className="text-[10px] text-gray-500">kg</span>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => onChange('weight', e.target.value)}
            onKeyDown={numericOnly}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <label className="flex flex-1 flex-col gap-0.5">
          <span className="text-[10px] text-gray-500">reps</span>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => onChange('reps', e.target.value)}
            onKeyDown={numericOnly}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
      </div>
    </div>
  )
}
