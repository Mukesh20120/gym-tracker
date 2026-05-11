const variants = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-indigo-500/40',
  secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600 active:bg-gray-500 disabled:bg-gray-700/40',
  ghost: 'bg-transparent text-gray-400 hover:text-gray-100 hover:bg-gray-800 disabled:text-gray-600',
}

/** @param {{ variant?: 'primary'|'secondary'|'ghost', className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>} props */
export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
