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
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (muscleFilter) params.muscle_group = muscleFilter
    if (categoryFilter) params.category = categoryFilter

    setLoading(true)
    api.exercises.list(params)
      .then((data) => setExercises(data as Exercise[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, muscleFilter, categoryFilter])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Exercise Library</h2>
        <p className="text-gray-500 text-sm mt-1">{exercises.length} exercises available</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent"
        />
        <div className="flex gap-3 flex-wrap">
          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          >
            <option value="">All Muscle Groups</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
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
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : exercises.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <p className="font-medium">No exercises found.</p>
          <p className="text-sm mt-1">Try a different search or add a custom exercise.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{ex.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {ex.primary_muscle_group.replace('_', ' ')} · {ex.equipment.replace('_', ' ')}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-1 rounded-full capitalize">
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
