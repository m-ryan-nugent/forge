import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { WorkoutSession } from '../api/types'

export function WorkoutLogger() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const workout = await api.workouts.create({ title: title.trim(), notes: notes.trim() || null }) as WorkoutSession
      navigate(`/workout/${workout.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Log Workout</h2>
        <p className="text-gray-500 text-sm mt-1">Start a new workout session.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workout Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Push Day, Leg Day, Morning Run"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about today's session..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent resize-none"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full bg-[#DC2626] hover:bg-[#EF4444] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Creating...' : 'Start Workout'}
        </button>
      </form>
    </div>
  )
}
