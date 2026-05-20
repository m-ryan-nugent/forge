import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/workout', label: 'Log Workout', icon: '＋' },
  { to: '/exercises', label: 'Exercises', icon: '◈' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/progress', label: 'Progress', icon: '↑' },
]

export function Navbar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 px-4 py-6 fixed top-0 left-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#DC2626] tracking-tight">Forge</h1>
          <p className="text-xs text-gray-400 mt-1">Build strength. Stay consistent.</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-50 text-[#DC2626]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-50">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors ${
                isActive ? 'text-[#DC2626]' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">{icon}</span>
            <span className="hidden xs:block">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
