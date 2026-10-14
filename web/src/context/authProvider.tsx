import { useState, type ReactNode } from 'react'
import type { User } from '../types'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'auth-user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  function login(u: User) {
    setUser(u)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) } catch { /* ignore */ }
  }

  function logout() {
    setUser(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}