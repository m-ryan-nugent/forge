import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { WorkoutSession, WorkoutStats } from '../api/types'

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
  chest: 'bg-red-50 text-red-700',
  back: 'bg-blue-50 text-blue-700',
  shoulders: 'bg-purple-50 text-purple-700',
  biceps: 'bg-orange-50 text-orange-700',
  triceps: 'bg-yellow-50 text-yellow-700',
  forearms: 'bg-amber-50 text-amber-700',
  core: 'bg-green-50 text-green-700',
  quads: 'bg-teal-50 text-teal-700',
  hamstrings: 'bg-cyan-50 text-cyan-700',
  glutes: 'bg-pink-50 text-pink-700',
  calves: 'bg-indigo-50 text-indigo-700',
  full_body: 'bg-gray-100 text-gray-700',
  cardio: 'bg-lime-50 text-lime-700',
}

export function Dashboard() {
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.workouts.stats(), api.workouts.list()])
      .then(([s, ws]) => {
        setStats(s)
        setRecentWorkouts(ws.slice(0, 5))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const lastWorkoutLabel = stats?.last_workout
    ? formatDate(stats.last_workout.date)
    : '—'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Let's get to work.</p>
      </div>

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
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Trained This Week
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.muscle_groups_this_week.map((mg) => (
              <span
                key={mg}
                className={`text-xs font-medium px-3 py-1 rounded-full ${MUSCLE_COLORS[mg] ?? 'bg-gray-100 text-gray-700'}`}
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
          <h3 className="text-lg font-semibold text-gray-800">Recent Workouts</h3>
          <Link to="/history" className="text-sm text-[#DC2626] hover:text-[#EF4444] font-medium">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : recentWorkouts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
            <p className="font-medium">No workouts yet.</p>
            <p className="text-sm mt-1">Log your first workout to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((w) => (
              <Link
                key={w.id}
                to={`/workout/${w.id}`}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{w.title}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(w.date)}
                    {w.exercise_count ? ` · ${w.exercise_count} exercise${w.exercise_count === 1 ? '' : 's'}` : ''}
                    {w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                    w.completed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
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
    <div className={`rounded-xl border px-4 py-4 ${highlight ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-[#DC2626]' : 'text-gray-900'}`}>
        {value}
        {sublabel && (
          <span className="text-sm font-normal text-gray-400 ml-1">{sublabel}</span>
        )}
      </p>
    </div>
  )
}
