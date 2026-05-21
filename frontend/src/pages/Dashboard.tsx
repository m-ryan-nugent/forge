import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { WorkoutSession, WorkoutStats, HabitDay } from '../api/types'
import { HabitChart } from '../components/HabitChart'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMuscleGroup(mg: string): string {
  return mg.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  back: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  shoulders: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  biceps: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  triceps: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  forearms: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  core: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  quads: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  hamstrings: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  glutes: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  calves: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  full_body: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  cardio: 'bg-lime-50 text-lime-700 dark:bg-lime-900/20 dark:text-lime-400',
}

export function Dashboard() {
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([])
  const [habitDays, setHabitDays] = useState<HabitDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.workouts.stats(), api.workouts.list(), api.habits.chart()])
      .then(([s, ws, hd]) => {
        setStats(s)
        setRecentWorkouts(ws.slice(0, 5))
        setHabitDays(hd)
      })
      .catch(() => setError('Failed to load dashboard data. Is the server running?'))
      .finally(() => setLoading(false))
  }, [])

  const lastWorkoutLabel = stats?.last_workout
    ? formatDate(stats.last_workout.date)
    : '—'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back. Let's get to work.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="This Week"
          value={loading ? '—' : String(stats?.weekly_count ?? 0)}
          sublabel="workouts"
        />
        <StatCard
          label="Streak"
          value={loading ? '—' : String(stats?.current_streak ?? 0)}
          sublabel={stats?.current_streak === 1 ? 'day' : 'days'}
          highlight={!!stats?.current_streak}
        />
        <StatCard
          label="Total Workouts"
          value={loading ? '—' : String(stats?.total_completed ?? 0)}
        />
        <StatCard
          label="Last Workout"
          value={loading ? '—' : lastWorkoutLabel}
        />
      </div>

      {/* Habit chart */}
      {!loading && habitDays.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Consistency
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <HabitChart days={habitDays} />
          </div>
        </section>
      )}

      {/* Start workout CTA */}
      <Link
        to="/workout"
        className="block w-full text-center bg-[#DC2626] hover:bg-[#EF4444] text-white font-semibold py-3 rounded-xl transition-colors"
      >
        + Start New Workout
      </Link>

      {/* Muscle groups trained this week */}
      {!loading && stats && stats.muscle_groups_this_week.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Trained This Week
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.muscle_groups_this_week.map((mg) => (
              <span
                key={mg}
                className={`text-xs font-medium px-3 py-1 rounded-full ${MUSCLE_COLORS[mg] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {formatMuscleGroup(mg)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent workouts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Workouts</h3>
          <Link to="/history" className="text-sm text-[#DC2626] hover:text-[#EF4444] font-medium">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-2xl mb-2">🏋️</p>
            <p className="font-medium text-gray-600 dark:text-gray-300">No workouts yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Log your first workout to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((w) => (
              <Link
                key={w.id}
                to={`/workout/${w.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{w.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(w.date)}
                    {w.exercise_count ? ` · ${w.exercise_count} exercise${w.exercise_count === 1 ? '' : 's'}` : ''}
                    {w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                    w.completed
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  }`}
                >
                  {w.completed ? 'Done' : 'In Progress'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string
  value: string
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border px-4 py-4 ${
      highlight
        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }`}>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-[#DC2626]' : 'text-gray-900 dark:text-white'}`}>
        {value}
        {sublabel && (
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">{sublabel}</span>
        )}
      </p>
    </div>
  )
}
