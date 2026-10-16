import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '../types'
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  // If there's a saved token, we're "loading" until the API confirms who it belongs to
  const [isLoading, setIsLoading] = useState(() => getToken() !== null)

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    queryClient.clear() // so the next person never sees the previous user's cached data
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    if (getToken() === null) return
    let cancelled = false

    api
      .get<User>('/auth/me')
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        /* a 401 already logged the user out through the handler */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      setToken(result.token)
      queryClient.clear()
      setUser(result.user)
    },
    [queryClient],
  )

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}