import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { WorkoutSession } from '../api/types'

type Filter = 'all' | 'month' | 'week'

function toLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

function formatDateLabel(dateStr: string): string {
  const d = toLocalDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function monthKey(dateStr: string): string {
  const d = toLocalDate(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function filterWorkouts(workouts: WorkoutSession[], filter: Filter): WorkoutSession[] {
  if (filter === 'all') return workouts
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (filter === 'week') {
    const dow = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    return workouts.filter((w) => toLocalDate(w.date) >= monday)
  }
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  return workouts.filter((w) => toLocalDate(w.date) >= monthStart)
}

function groupByMonth(workouts: WorkoutSession[]): [string, WorkoutSession[]][] {
  const map = new Map<string, WorkoutSession[]>()
  for (const w of workouts) {
    const key = monthKey(w.date)
    const group = map.get(key) ?? []
    group.push(w)
    map.set(key, group)
  }
  return Array.from(map.entries())
}

export function WorkoutHistory() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    api.workouts.list()
      .then((data) => setWorkouts(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterWorkouts(workouts, filter)
  const completed = filtered.filter((w) => w.completed).length
  const groups = groupByMonth(filtered)

  const filterLabels: Record<Filter, string> = {
    all: 'All Time',
    month: 'This Month',
    week: 'This Week',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workout History</h2>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? 'Loading...' : `${completed} completed · ${filtered.length} total`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'month', 'week'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#DC2626] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <p className="font-medium">No workouts found.</p>
          <p className="text-sm mt-1">
            {filter === 'all'
              ? 'Complete your first workout to see it here.'
              : 'Try a wider time range.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([month, ws]) => (
            <section key={month}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {month}
                <span className="ml-2 font-normal normal-case">
                  · {ws.filter((w) => w.completed).length} completed
                </span>
              </h3>
              <div className="space-y-2">
                {ws.map((w) => (
                  <Link
                    key={w.id}
                    to={`/workout/${w.id}`}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{w.title}</p>
                      <p className="text-xs text-gray-400">
                        {formatDateLabel(w.date)}
                        {w.exercise_count
                          ? ` · ${w.exercise_count} exercise${w.exercise_count === 1 ? '' : 's'}`
                          : ''}
                        {w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                        w.completed
                          ? 'bg-green-50 text-green-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {w.completed ? 'Done' : 'In Progress'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
