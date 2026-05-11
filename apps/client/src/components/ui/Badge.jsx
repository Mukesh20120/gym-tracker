const colors = {
  indigo: 'bg-indigo-500/20 text-indigo-300',
  green:  'bg-green-500/20 text-green-300',
  red:    'bg-red-500/20 text-red-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  gray:   'bg-gray-700 text-gray-300',
}

/** @param {{ color?: keyof colors, className?: string }} props */
export default function Badge({ color = 'indigo', className = '', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
