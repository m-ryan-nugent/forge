import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import type { WorkoutSession, WorkoutExercise, SetEntry, Exercise } from '../api/types'

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'cardio',
] as const

interface WEWithData {
  we: WorkoutExercise
  exercise: Exercise
  sets: SetEntry[]
}

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const workoutId = parseInt(id!)

  const [workout, setWorkout] = useState<WorkoutSession | null>(null)
  const [wes, setWes] = useState<WEWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWorkout = useCallback(async () => {
    try {
      const [workoutData, exercisesData] = await Promise.all([
        api.workouts.get(workoutId) as Promise<WorkoutSession>,
        api.workouts.exercises.list(workoutId) as Promise<WorkoutExercise[]>,
      ])
      setWorkout(workoutData)
      const wesWithData = await Promise.all(
        exercisesData.map(async (we) => {
          const [exercise, sets] = await Promise.all([
            api.exercises.get(we.exercise_id) as Promise<Exercise>,
            api.workouts.sets.list(workoutId, we.id) as Promise<SetEntry[]>,
          ])
          return { we, exercise, sets }
        })
      )
      setWes(wesWithData)
    } catch {
      setError('Failed to load workout')
    } finally {
      setLoading(false)
    }
  }, [workoutId])

  useEffect(() => {
    loadWorkout()
  }, [loadWorkout])

  async function handleAddExercise(exercise: Exercise) {
    try {
      const we = await api.workouts.exercises.add(workoutId, {
        workout_session_id: workoutId,
        exercise_id: exercise.id,
        order: wes.length,
      }) as WorkoutExercise
      setWes(prev => [...prev, { we, exercise, sets: [] }])
      setShowAddExercise(false)
    } catch {
      setError('Failed to add exercise')
    }
  }

  async function handleRemoveExercise(weId: number) {
    try {
      await api.workouts.exercises.remove(workoutId, weId)
      setWes(prev => prev.filter(w => w.we.id !== weId))
    } catch {
      setError('Failed to remove exercise')
    }
  }

  async function handleAddSet(weId: number) {
    const weData = wes.find(w => w.we.id === weId)
    if (!weData) return
    try {
      const newSet = await api.workouts.sets.add(workoutId, weId, {
        workout_exercise_id: weId,
        set_number: weData.sets.length + 1,
        completed: false,
      }) as SetEntry
      setWes(prev => prev.map(w =>
        w.we.id === weId ? { ...w, sets: [...w.sets, newSet] } : w
      ))
    } catch {
      setError('Failed to add set')
    }
  }

  async function handleUpdateSet(weId: number, setId: number, updates: Partial<SetEntry>) {
    const weData = wes.find(w => w.we.id === weId)
    if (!weData) return
    const existing = weData.sets.find(s => s.id === setId)
    if (!existing) return
    const merged = { ...existing, ...updates }
    try {
      const saved = await api.workouts.sets.update(workoutId, weId, setId, merged) as SetEntry
      setWes(prev => prev.map(w =>
        w.we.id === weId
          ? { ...w, sets: w.sets.map(s => s.id === setId ? saved : s) }
          : w
      ))
    } catch {
      setError('Failed to save set')
    }
  }

  async function handleDeleteSet(weId: number, setId: number) {
    try {
      await api.workouts.sets.delete(workoutId, weId, setId)
      setWes(prev => prev.map(w =>
        w.we.id === weId
          ? { ...w, sets: w.sets.filter(s => s.id !== setId) }
          : w
      ))
    } catch {
      setError('Failed to delete set')
    }
  }

  async function handleToggleComplete() {
    if (!workout) return
    setCompleting(true)
    try {
      const saved = await api.workouts.update(workoutId, { ...workout, completed: !workout.completed }) as WorkoutSession
      setWorkout(saved)
    } catch {
      setError('Failed to update workout')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-1/4 animate-pulse" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl mb-2">❓</p>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Workout not found.</p>
        <Link to="/workout" className="text-[#DC2626] text-sm mt-2 block">Start a new workout</Link>
      </div>
    )
  }

  const totalSets = wes.reduce((sum, w) => sum + w.sets.length, 0)
  const completedSets = wes.reduce((sum, w) => sum + w.sets.filter(s => s.completed).length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/history" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          ← History
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{workout.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {workout.date}
              {totalSets > 0 && ` · ${completedSets}/${totalSets} sets done`}
            </p>
            {workout.notes && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 italic">{workout.notes}</p>
            )}
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ml-4 ${
            workout.completed
              ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
          }`}>
            {workout.completed ? 'Completed' : 'In Progress'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none ml-3">×</button>
        </div>
      )}

      {/* Exercise cards */}
      {wes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-2xl mb-2">💪</p>
          <p className="font-medium text-gray-600 dark:text-gray-300">No exercises yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add an exercise to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {wes.map(({ we, exercise, sets }) => (
            <ExerciseCard
              key={we.id}
              we={we}
              exercise={exercise}
              sets={sets}
              onAddSet={() => handleAddSet(we.id)}
              onUpdateSet={(setId, updates) => handleUpdateSet(we.id, setId, updates)}
              onDeleteSet={(setId) => handleDeleteSet(we.id, setId)}
              onRemove={() => handleRemoveExercise(we.id)}
            />
          ))}
        </div>
      )}

      {/* Add exercise */}
      <button
        onClick={() => setShowAddExercise(true)}
        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-[#DC2626] hover:text-[#DC2626] dark:hover:border-[#DC2626] dark:hover:text-[#DC2626] transition-colors"
      >
        + Add Exercise
      </button>

      {/* Complete / Reopen */}
      <button
        onClick={handleToggleComplete}
        disabled={completing}
        className={`w-full font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 ${
          workout.completed
            ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
            : 'bg-[#DC2626] hover:bg-[#EF4444] text-white'
        }`}
      >
        {completing ? '...' : workout.completed ? 'Reopen Workout' : 'Complete Workout'}
      </button>

      {showAddExercise && (
        <AddExerciseModal
          existingIds={wes.map(w => w.exercise.id)}
          onAdd={handleAddExercise}
          onClose={() => setShowAddExercise(false)}
        />
      )}
    </div>
  )
}

// ---- ExerciseCard ----

function ExerciseCard({
  exercise,
  sets,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onRemove,
}: {
  we: WorkoutExercise
  exercise: Exercise
  sets: SetEntry[]
  onAddSet: () => void
  onUpdateSet: (setId: number, updates: Partial<SetEntry>) => void
  onDeleteSet: (setId: number) => void
  onRemove: () => void
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{exercise.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
            {exercise.primary_muscle_group.replace('_', ' ')} · {exercise.equipment.replace('_', ' ')}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors text-2xl leading-none"
          title="Remove exercise"
        >
          ×
        </button>
      </div>

      <div className="px-4 py-3 space-y-1">
        {sets.length > 0 && (
          <div className="grid grid-cols-[2rem_1fr_1fr_auto] sm:grid-cols-[2.5rem_1fr_1fr_4.5rem] gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium px-1 pb-1">
            <span className="text-center">#</span>
            <span>Weight</span>
            <span>Reps</span>
            <span></span>
          </div>
        )}
        {sets.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-2">No sets yet.</p>
        )}
        {sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            onUpdate={(updates) => onUpdateSet(set.id, updates)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
        <button
          onClick={onAddSet}
          className="w-full text-sm text-[#DC2626] hover:text-[#EF4444] font-medium py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mt-1"
        >
          + Add Set
        </button>
      </div>
    </div>
  )
}

// ---- SetRow ----

function SetRow({
  set,
  onUpdate,
  onDelete,
}: {
  set: SetEntry
  onUpdate: (updates: Partial<SetEntry>) => void
  onDelete: () => void
}) {
  const [weight, setWeight] = useState(set.weight?.toString() ?? '')
  const [reps, setReps] = useState(set.reps?.toString() ?? '')

  function saveWeight() {
    const val = weight === '' ? null : parseFloat(weight)
    const clean = val === null || isNaN(val) ? null : val
    if (clean !== set.weight) onUpdate({ weight: clean })
  }

  function saveReps() {
    const val = reps === '' ? null : parseInt(reps)
    const clean = val === null || isNaN(val) ? null : val
    if (clean !== set.reps) onUpdate({ reps: clean })
  }

  const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'

  return (
    <div className={`grid grid-cols-[2rem_1fr_1fr_auto] sm:grid-cols-[2.5rem_1fr_1fr_4.5rem] gap-2 items-center px-1 py-1 rounded-lg transition-colors ${
      set.completed ? 'bg-green-50 dark:bg-green-900/10' : ''
    }`}>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">{set.set_number}</span>

      <div className="flex items-center gap-1 min-w-0">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={saveWeight}
          placeholder="—"
          min="0"
          step="2.5"
          className={inputCls}
        />
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:inline">lbs</span>
      </div>

      <div className="flex items-center gap-1 min-w-0">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={saveReps}
          placeholder="—"
          min="0"
          className={inputCls}
        />
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:inline">reps</span>
      </div>

      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={() => onUpdate({ completed: !set.completed })}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
            set.completed
              ? 'bg-[#22C55E] border-[#22C55E] text-white'
              : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-green-400'
          }`}
          title={set.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          ✓
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors text-2xl leading-none"
          title="Delete set"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ---- AddExerciseModal ----

function AddExerciseModal({
  existingIds,
  onAdd,
  onClose,
}: {
  existingIds: number[]
  onAdd: (exercise: Exercise) => void
  onClose: () => void
}) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (muscleFilter) params.muscle_group = muscleFilter
    setLoading(true)
    api.exercises.list(params)
      .then((data) => setExercises(data as Exercise[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, muscleFilter])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add Exercise</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">×</button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            autoFocus
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Muscle Groups</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-50 dark:divide-gray-700">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm p-4 text-center">No exercises found.</p>
          ) : (
            exercises.map((ex) => {
              const added = existingIds.includes(ex.id)
              return (
                <button
                  key={ex.id}
                  onClick={() => !added && onAdd(ex)}
                  disabled={added}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-40 disabled:cursor-default"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{ex.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                        {ex.primary_muscle_group.replace('_', ' ')} · {ex.equipment.replace('_', ' ')}
                      </p>
                    </div>
                    {added && <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">Added</span>}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
