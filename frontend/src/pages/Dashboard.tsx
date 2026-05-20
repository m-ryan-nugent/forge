import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { WorkoutSession } from '../api/types'

export function Dashboard() {
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.workouts.list()
      .then((data) => setRecentWorkouts((data as WorkoutSession[]).slice(0, 5)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const completedThisWeek = recentWorkouts.filter((w) => {
    const workoutDate = new Date(w.date)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return w.completed && workoutDate >= weekAgo
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Let's get to work.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Workouts This Week" value={String(completedThisWeek)} />
        <StatCard label="Current Streak" value="—" sublabel="days" />
        <StatCard label="Total Workouts" value={String(recentWorkouts.length)} />
        <StatCard label="Last Workout" value={recentWorkouts[0]?.date ?? '—'} />
      </div>

      {/* Start workout CTA */}
      <Link
        to="/workout"
        className="block w-full text-center bg-[#DC2626] hover:bg-[#EF4444] text-white font-semibold py-3 rounded-xl transition-colors"
      >
        + Start New Workout
      </Link>

      {/* Recent workouts */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Workouts</h3>
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
                  <p className="text-xs text-gray-400">{w.date}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${w.completed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
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

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {value}
        {sublabel && <span className="text-sm font-normal text-gray-400 ml-1">{sublabel}</span>}
      </p>
    </div>
  )
}
