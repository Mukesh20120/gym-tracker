import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import LogWorkout from './pages/LogWorkout'
import History from './pages/History'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import WorkoutDayManager from './pages/WorkoutDayManager'
import DayExerciseEditor from './pages/DayExerciseEditor'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="log" element={<LogWorkout />} />
                <Route path="history" element={<History />} />
                <Route path="progress" element={<Progress />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/days" element={<WorkoutDayManager />} />
                <Route path="settings/days/:dayId" element={<DayExerciseEditor />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
