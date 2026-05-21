import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Exercise, MuscleGroup, ExerciseCategory } from '../api/types'

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'cardio',
]

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'mobility', 'core']

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (muscleFilter) params.muscle_group = muscleFilter
    if (categoryFilter) params.category = categoryFilter

    setLoading(true)
    setError(null)
    api.exercises.list(params)
      .then((data) => setExercises(data as Exercise[]))
      .catch(() => setError('Failed to load exercises. Is the server running?'))
      .finally(() => setLoading(false))
  }, [search, muscleFilter, categoryFilter])

  const inputCls = 'border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exercise Library</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{exercises.length} exercises available</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <div className="flex gap-3 flex-wrap">
          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className={inputCls}
          >
            <option value="">All Muscle Groups</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputCls}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercise list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="font-medium text-gray-600 dark:text-gray-300">No exercises found.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search or add a custom exercise.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{ex.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                    {ex.primary_muscle_group.replace('_', ' ')} · {ex.equipment.replace('_', ' ')}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium px-2 py-1 rounded-full capitalize">
                  {ex.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
