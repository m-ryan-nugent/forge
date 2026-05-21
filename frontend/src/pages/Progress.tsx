import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type {
  Exercise,
  ExerciseProgressPoint,
  PersonalRecord,
  VolumePoint,
  FrequencyPoint,
  BodyMetric,
} from '../api/types'

// ─── LineChart ────────────────────────────────────────────────────────────────

interface LineChartProps {
  data: { date: string; value: number }[]
  unit?: string
  color?: string
}

function LineChart({ data, unit = '', color = '#DC2626' }: LineChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm">
        No data yet
      </div>
    )
  }

  const W = 800, H = 220
  const ml = 60, mr = 20, mt = 15, mb = 40
  const cw = W - ml - mr
  const ch = H - mt - mb

  const vals = data.map(d => d.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV === minV ? 1 : maxV - minV

  const xPos = (i: number) =>
    data.length === 1 ? ml + cw / 2 : ml + (i / (data.length - 1)) * cw
  const yPos = (v: number) => mt + ch - ((v - minV) / range) * ch

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i)},${yPos(d.value)}`)
    .join(' ')
  const areaD = `${pathD} L${xPos(data.length - 1)},${mt + ch} L${xPos(0)},${mt + ch} Z`

  const step = Math.max(1, Math.floor(data.length / 6))
  const xLabelIdxs = data.reduce((acc: number[], _, i) => {
    if (i === 0 || i === data.length - 1 || i % step === 0) acc.push(i)
    return acc
  }, [])

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleString('default', {
      month: 'short',
      day: 'numeric',
    })
  }

  const yTicks = [minV, (minV + maxV) / 2, maxV]
  const fmtVal = (v: number) => `${v % 1 === 0 ? v : v.toFixed(1)}${unit}`
  const gradId = `lg${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 140 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={ml} y1={yPos(v)} x2={W - mr} y2={yPos(v)} stroke="var(--chart-grid)" strokeWidth="1" />
          <text x={ml - 8} y={yPos(v) + 4} textAnchor="end" fontSize={11} fill="var(--chart-text)">
            {fmtVal(v)}
          </text>
        </g>
      ))}

      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />

      {data.map((d, i) => (
        <circle
          key={i}
          cx={xPos(i)}
          cy={yPos(d.value)}
          r={3.5}
          fill={color}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {xLabelIdxs.map(i => (
        <text
          key={i}
          x={xPos(i)}
          y={mt + ch + 22}
          textAnchor="middle"
          fontSize={10}
          fill="var(--chart-text)"
        >
          {fmtDate(data[i].date)}
        </text>
      ))}
    </svg>
  )
}

// ─── FrequencyChart ───────────────────────────────────────────────────────────

function FrequencyChart({ data }: { data: FrequencyPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        No data yet
      </div>
    )
  }

  const W = 800, H = 160
  const ml = 24, mr = 12, mt = 10, mb = 32
  const cw = W - ml - mr
  const ch = H - mt - mb
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const colW = cw / data.length
  const barW = Math.min(36, colW * 0.65)

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleString('default', { month: 'short', day: 'numeric' })
  }

  const step = Math.max(1, Math.floor(data.length / 8))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 120 }}>
      {data.map((d, i) => {
        const bh = (d.count / maxCount) * ch
        const cx = ml + colW * i + colW / 2
        return (
          <g key={i}>
            <rect
              x={cx - barW / 2}
              y={mt + ch - bh}
              width={barW}
              height={bh}
              rx={3}
              fill="#DC2626"
              opacity={0.75}
            />
            {i % step === 0 && (
              <text x={cx} y={mt + ch + 18} textAnchor="middle" fontSize={9} fill="var(--chart-text)">
                {fmtDate(d.week_start)}
              </text>
            )}
          </g>
        )
      })}
      {[1, 2, 3, 4, 5, 6, 7].map(v => {
        if (v > maxCount) return null
        const y = mt + ch - (v / maxCount) * ch
        return (
          <text key={v} x={ml - 4} y={y + 3} textAnchor="end" fontSize={9} fill="var(--chart-text)">
            {v}
          </text>
        )
      })}
    </svg>
  )
}

// ─── VolumeChart ──────────────────────────────────────────────────────────────

function VolumeChart({ data }: { data: VolumePoint[] }) {
  const totals: Record<string, number> = {}
  data.forEach(({ muscle_group, total_volume }) => {
    totals[muscle_group] = (totals[muscle_group] || 0) + total_volume
  })

  const sorted = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  if (!sorted.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        No data yet
      </div>
    )
  }

  const maxVol = sorted[0][1]

  return (
    <div className="space-y-3">
      {sorted.map(([muscle, vol]) => (
        <div key={muscle} className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-300 w-28 text-right capitalize shrink-0">
            {muscle.replace(/_/g, ' ')}
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
            <div
              className="h-5 rounded-full"
              style={{
                width: `${(vol / maxVol) * 100}%`,
                background: 'linear-gradient(90deg, #DC2626, #EF4444)',
              }}
            />
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right shrink-0 tabular-nums">
            {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol.toFixed(0)} lbs
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Progress Page ────────────────────────────────────────────────────────────

type Tab = 'records' | 'strength' | 'volume' | 'body'

const TABS: { id: Tab; label: string }[] = [
  { id: 'records', label: 'Records' },
  { id: 'strength', label: 'Strength' },
  { id: 'volume', label: 'Volume' },
  { id: 'body', label: 'Body' },
]

export function Progress() {
  const [tab, setTab] = useState<Tab>('records')
  const [error, setError] = useState<string | null>(null)

  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null)
  const [strengthMonths, setStrengthMonths] = useState(6)
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgressPoint[]>([])
  const [volumeData, setVolumeData] = useState<VolumePoint[]>([])
  const [frequencyData, setFrequencyData] = useState<FrequencyPoint[]>([])
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])

  const [bodyDate, setBodyDate] = useState(new Date().toISOString().split('T')[0])
  const [bodyWeight, setBodyWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.progress.records(),
      api.progress.volume(12),
      api.progress.frequency(6),
      api.bodyMetrics.list(),
      api.exercises.list(),
    ])
      .then(([recs, vol, freq, metrics, exs]) => {
        setRecords(recs)
        setVolumeData(vol)
        setFrequencyData(freq)
        setBodyMetrics(metrics)
        setExercises(exs as Exercise[])
      })
      .catch(() => setError('Failed to load progress data. Is the server running?'))
  }, [])

  useEffect(() => {
    if (!selectedExercise) {
      setExerciseProgress([])
      return
    }
    api.progress.exercise(selectedExercise, strengthMonths).then(setExerciseProgress)
  }, [selectedExercise, strengthMonths])

  const handleAddBodyMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bodyWeight && !bodyFat) return
    setSaving(true)
    try {
      const created = await api.bodyMetrics.create({
        date: bodyDate,
        body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
      })
      setBodyMetrics(prev =>
        [created, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      )
      setBodyWeight('')
      setBodyFat('')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBodyMetric = async (id: number) => {
    await api.bodyMetrics.delete(id)
    setBodyMetrics(prev => prev.filter(m => m.id !== id))
  }

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('default', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const exercisesWithData = exercises.filter(ex => records.some(r => r.exercise_id === ex.id))

  const bodyWeightData = bodyMetrics
    .filter(m => m.body_weight !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({ date: m.date, value: m.body_weight! }))

  const inputCls = 'border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your strength and consistency over time.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Records ── */}
      {tab === 'records' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Personal Records</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Best set per exercise across all completed workouts
            </p>
          </div>

          {records.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-2xl mb-2">🏆</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Complete some workouts to see your records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Exercise</th>
                    <th className="text-left px-4 py-3">Muscle</th>
                    <th className="text-right px-4 py-3">Best Weight</th>
                    <th className="text-right px-4 py-3">Reps</th>
                    <th className="text-right px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {records.map(r => (
                    <tr key={r.exercise_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{r.exercise_name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                          {r.muscle_group.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400 tabular-nums">
                        {r.max_weight} lbs
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                        {r.reps_at_max != null ? `${r.reps_at_max}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 dark:text-gray-500">{fmtDate(r.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Strength ── */}
      {tab === 'strength' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Exercise</label>
              <select
                value={selectedExercise ?? ''}
                onChange={e =>
                  setSelectedExercise(e.target.value ? Number(e.target.value) : null)
                }
                className={inputCls + ' w-full'}
              >
                <option value="">Select an exercise…</option>
                {exercisesWithData.length === 0 && (
                  <option disabled>No exercises with logged data</option>
                )}
                {exercisesWithData.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Time range</label>
              <div className="flex gap-1">
                {[1, 3, 6, 12].map(m => (
                  <button
                    key={m}
                    onClick={() => setStrengthMonths(m)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      strengthMonths === m
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {m}M
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!selectedExercise ? (
            <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm">
              Select an exercise above to view strength progress.
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Max weight per session (lbs)</p>
                <LineChart
                  data={exerciseProgress.map(p => ({ date: p.date, value: p.max_weight }))}
                  unit=" lbs"
                />
              </div>

              {exerciseProgress.length > 0 && (
                <div className="grid grid-cols-3 gap-4 border-t border-gray-50 dark:border-gray-700 pt-5">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                      {Math.max(...exerciseProgress.map(p => p.max_weight))}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Best (lbs)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                      {exerciseProgress.reduce((s, p) => s + p.set_count, 0)}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Total sets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                      {(
                        exerciseProgress.reduce((s, p) => s + p.total_volume, 0) / 1000
                      ).toFixed(1)}
                      k
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Volume (lbs)</div>
                  </div>
                </div>
              )}

              {exerciseProgress.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-500 text-sm">
                  No data for this exercise in the selected time range.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Volume ── */}
      {tab === 'volume' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">Volume by Muscle Group</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-5">
              Total weight × reps, last 12 weeks
            </p>
            <VolumeChart data={volumeData} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">Workout Frequency</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-4">
              Completed workouts per week, last 6 months
            </p>
            <FrequencyChart data={frequencyData} />
          </div>
        </div>
      )}

      {/* ── Body ── */}
      {tab === 'body' && (
        <div className="space-y-4">
          {/* Log form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Log Body Metrics</h3>
            <form onSubmit={handleAddBodyMetric} className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={bodyDate}
                  onChange={e => setBodyDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="175.0"
                  value={bodyWeight}
                  onChange={e => setBodyWeight(e.target.value)}
                  className={inputCls + ' w-32'}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Body Fat % (optional)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="15.0"
                  value={bodyFat}
                  onChange={e => setBodyFat(e.target.value)}
                  className={inputCls + ' w-32'}
                />
              </div>
              <button
                type="submit"
                disabled={saving || (!bodyWeight && !bodyFat)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Saving…' : 'Log'}
              </button>
            </form>
          </div>

          {/* Body weight chart */}
          {bodyWeightData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Body Weight</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Weight over time (lbs)</p>
              <LineChart data={bodyWeightData} unit=" lbs" color="#2563EB" />
            </div>
          )}

          {/* Recent entries table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Log</h3>
            </div>
            {bodyMetrics.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">No body metrics logged yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {bodyMetrics.slice(0, 30).map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(m.date)}</div>
                    <div className="flex items-center gap-5">
                      {m.body_weight !== null && (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                          {m.body_weight} lbs
                        </span>
                      )}
                      {m.body_fat_percentage !== null && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                          {m.body_fat_percentage}% BF
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteBodyMetric(m.id)}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
