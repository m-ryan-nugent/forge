import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { WorkoutSession } from '../api/types'

export function WorkoutHistory() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.workouts.list()
      .then((data) => setWorkouts(data as WorkoutSession[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workout History</h2>
        <p className="text-gray-500 text-sm mt-1">{workouts.length} workouts logged</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : workouts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <p className="font-medium">No workouts yet.</p>
          <p className="text-sm mt-1">Complete your first workout to see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map((w) => (
            <Link
              key={w.id}
              to={`/workout/${w.id}`}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{w.title}</p>
                <p className="text-xs text-gray-400">
                  {w.date}
                  {w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${w.completed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                {w.completed ? 'Done' : 'In Progress'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
