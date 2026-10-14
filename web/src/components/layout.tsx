import { NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

const studentLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/homework', label: 'Homework', end: false },
]

const teacherLinks = [
  { to: '/admin/lessons', label: 'Lessons', end: false },
  { to: '/admin/students', label: 'Students', end: false },
  { to: '/admin/homework', label: 'Homework', end: false },
  { to: '/admin/submissions', label: 'Submissions', end: false },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()

  const links = user?.role === 'teacher' ? teacherLinks : studentLinks

  function handleLogout() {
    queryClient.clear() // so the next person never sees the previous user's cached data
    logout()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="text-lg font-bold text-indigo-600">English Lessons</span>
          <div className="flex flex-wrap items-center gap-2">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            <span className="ml-2 text-sm text-slate-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}