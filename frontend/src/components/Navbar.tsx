import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/workout', label: 'Log Workout', icon: '＋' },
  { to: '/exercises', label: 'Exercises', icon: '◈' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/progress', label: 'Progress', icon: '↑' },
]

function getInitialTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('forge-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 px-4 py-6 fixed top-0 left-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#DC2626] tracking-tight">Forge</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Build strength. Stay consistent.</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-[#DC2626]'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleTheme}
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-base">{theme === 'dark' ? '☀' : '☾'}</span>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around z-50">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-2 text-xs font-medium transition-colors ${
                isActive ? 'text-[#DC2626]' : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <span className="text-xl mb-0.5">{icon}</span>
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400"
        >
          <span className="text-xl mb-0.5">{theme === 'dark' ? '☀' : '☾'}</span>
          <span className="text-[10px]">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
    </>
  )
}
