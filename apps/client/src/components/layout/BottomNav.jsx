import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/log',
    label: 'Log',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" strokeLinecap="round" />
        <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <polyline strokeLinecap="round" strokeLinejoin="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-800 bg-gray-900"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
              isActive ? 'text-indigo-400' : 'text-gray-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {icon(isActive)}
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
