import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <p className="text-5xl font-bold text-gray-600">404</p>
      <p className="text-gray-400">Page not found</p>
      <Link to="/" className="text-indigo-400 underline">Go home</Link>
    </div>
  )
}
