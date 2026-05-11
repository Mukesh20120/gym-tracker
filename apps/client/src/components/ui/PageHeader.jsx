import { useTheme } from '../../context/ThemeContext'

/** @param {{ title: string, action?: React.ReactNode }} props */
export default function PageHeader({ title, action }) {
  const { dark, toggle } = useTheme()

  return (
    <header className="flex items-center justify-between px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        {action}
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
        >
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
