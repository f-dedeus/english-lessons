import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { User } from '../types'

const demoStudent: User = { id: 1, name: 'Ana', email: 'ana@example.com', role: 'student' }
const demoTeacher: User = { id: 100, name: 'Teacher', email: 'teacher@example.com', role: 'teacher' }

export default function Login() {
  const { user, login } = useAuth()

  if (user) return <Navigate to={user.role === 'teacher' ? '/admin/lessons' : '/'} replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-indigo-600">English Lessons</h1>
        <p className="text-center text-sm text-slate-500">Demo login (real login comes with the API)</p>
        <button
          onClick={() => login(demoStudent)}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Enter as student
        </button>
        <button
          onClick={() => login(demoTeacher)}
          className="w-full rounded-md border border-indigo-600 px-4 py-2 font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Enter as teacher
        </button>
      </div>
    </div>
  )
}