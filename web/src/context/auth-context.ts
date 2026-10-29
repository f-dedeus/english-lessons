import { createContext } from 'react'
import type { User } from '../types'

export type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<User>
}

export const AuthContext = createContext<AuthContextValue | null>(null)