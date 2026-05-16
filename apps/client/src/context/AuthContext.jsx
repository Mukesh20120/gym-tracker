import { createContext, useContext, useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { authApi, useGetMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } from '../store/api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [error, setError] = useState(null)
  const dispatch = useDispatch()

  const { data, isLoading: loading } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: false })
  const user = data?.user ?? null

  const [loginMutation] = useLoginMutation()
  const [registerMutation] = useRegisterMutation()
  const [logoutMutation] = useLogoutMutation()

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const result = await loginMutation({ email, password })
      if (result.error) {
        setError(result.error.data ?? 'Login failed')
        return false
      }
      // Patch the cache immediately so user is available before navigate()
      dispatch(authApi.util.upsertQueryData('getMe', undefined, result.data))
      return true
    } catch {
      setError('Unable to connect to server. Please try again.')
      return false
    }
  }, [loginMutation, dispatch])

  const register = useCallback(async (email, password, displayName) => {
    setError(null)
    try {
      const result = await registerMutation({ email, password, displayName })
      if (result.error) {
        setError(result.error.data ?? 'Registration failed')
        return false
      }
      dispatch(authApi.util.upsertQueryData('getMe', undefined, result.data))
      return true
    } catch {
      setError('Unable to connect to server. Please try again.')
      return false
    }
  }, [registerMutation, dispatch])

  const logout = useCallback(async () => {
    await logoutMutation()
    dispatch(authApi.util.resetApiState())
  }, [logoutMutation, dispatch])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
