import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePendingStudentCount } from '../hooks/usePendingStudentCount'
import { usePlacementWaitingCount } from '../hooks/usePlacementAdmin'
import Logo from './logo'
import NotificationBell from './notificationBell'
import ThemeToggle from './themeToggle'

const menuLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
  }`

const studentLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/homework', label: 'Homework', end: false },
]

const teacherLinks = [
  { to: '/admin/lessons', label: 'Lessons', end: false },
  { to: '/admin/students', label: 'Students', end: false },
  { to: '/admin/placement', label: 'Placement', end: false },
  { to: '/admin/homework', label: 'Homework', end: false },
  { to: '/admin/submissions', label: 'Submissions', end: false },
  { to: '/admin/payments', label: 'Payments', end: false },
]

// The text in the browser tab
const titles: [string, string][] = [
  ['/admin/lessons', 'Lessons'],
  ['/admin/students', 'Students'],
  ['/admin/placement', 'Placement test'],
  ['/admin/homework', 'Homework'],
  ['/admin/submissions', 'Submissions'],
  ['/admin/payments', 'Payments'],
  ['/homework', 'Homework'],
  ['/lessons', 'Lesson'],
  ['/account', 'My account'],
]

function pageTitle(pathname: string) {
  const match = titles.find(([prefix]) => pathname.startsWith(prefix))
  return match ? `${match[1]} · English Lessons` : 'English Lessons'
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const pendingCount = usePendingStudentCount()
  const waitingCount = usePlacementWaitingCount()

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = pageTitle(pathname)
  }, [pathname])

  // Close the menu when clicking elsewhere or pressing Escape
  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const links = user?.role === 'teacher' ? teacherLinks : studentLinks

  function badgeFor(to: string) {
    if (to === '/admin/students') return pendingCount
    if (to === '/admin/placement') return waitingCount
    return 0
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* The account: a circle with the initial, and the name from small screens up */}
            <span
              className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-1 text-sm font-semibold text-slate-700 sm:pr-3"
              title={user?.name}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gem text-xs font-bold text-brown">
                {initial}
              </span>
              <span className="hidden max-w-36 truncate sm:inline">{user?.name}</span>
            </span>

            <ThemeToggle />
            <NotificationBell />

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="main-menu"
                aria-label={open ? 'Close the menu' : 'Open the menu'}
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>

              {open && (
                <nav
                  id="main-menu"
                  aria-label="Main menu"
                  className="absolute right-0 z-30 mt-2 w-64 space-y-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
                >
                  {links.map((l) => {
                    const badge = badgeFor(l.to)
                    return (
                      <NavLink
                        key={l.to}
                        to={l.to}
                        end={l.end}
                        className={menuLinkClass}
                        onClick={() => setOpen(false)}
                      >
                        {l.label}
                        {badge > 0 && (
                          <span className="rounded-full bg-gem px-2 py-0.5 text-xs font-semibold text-brown">{badge}</span>
                        )}
                      </NavLink>
                    )
                  })}

                  <div className="my-2 border-t border-slate-100" />

                  <NavLink to="/account" className={menuLinkClass} onClick={() => setOpen(false)}>
                    Account
                  </NavLink>
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Log out
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}