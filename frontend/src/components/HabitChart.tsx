import { useState } from 'react'
import type { HabitDay } from '../api/types'

const INTENSITY_COLORS = [
  '#EBEDF0', // 0: no workout
  '#FCA5A5', // 1: 1–2 exercises
  '#F87171', // 2: 3–4 exercises
  '#EF4444', // 3: 5–6 exercises
  '#DC2626', // 4: 7+ exercises
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  days: HabitDay[]
}

interface TooltipState {
  day: HabitDay
  x: number
  y: number
}

export function HabitChart({ days }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  if (days.length === 0) return null

  // Group into weeks (columns); each week has 7 days Sun–Sat
  const weeks: HabitDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Build month label positions: for each week column, record the month if
  // the first day of that week is the start of a new month (or it's week 0)
  const monthLabels: { col: number; label: string }[] = []
  weeks.forEach((week, col) => {
    const first = new Date(week[0].date + 'T00:00:00')
    if (col === 0 || first.getDate() <= 7) {
      // Show month if first day of week is within first 7 days of the month
      if (col === 0 || new Date(weeks[col - 1][0].date + 'T00:00:00').getMonth() !== first.getMonth()) {
        monthLabels.push({ col, label: SHORT_MONTHS[first.getMonth()] })
      }
    }
  })

  const cellSize = 13
  const cellGap = 3
  const step = cellSize + cellGap
  const leftPad = 28 // space for day labels
  const topPad = 20  // space for month labels
  const svgWidth = leftPad + weeks.length * step
  const svgHeight = topPad + 7 * step

  function formatTooltipDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        style={{ display: 'block' }}
        className="overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Month labels */}
        {monthLabels.map(({ col, label }) => (
          <text
            key={col}
            x={leftPad + col * step}
            y={12}
            fontSize={10}
            fill="#6B7280"
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Day labels (Mon, Wed, Fri) */}
        {[1, 3, 5].map((dayIndex) => (
          <text
            key={dayIndex}
            x={leftPad - 4}
            y={topPad + dayIndex * step + cellSize - 2}
            fontSize={9}
            fill="#9CA3AF"
            textAnchor="end"
            fontFamily="system-ui, sans-serif"
          >
            {DAY_LABELS[dayIndex].slice(0, 3)}
          </text>
        ))}

        {/* Cells */}
        {weeks.map((week, col) =>
          week.map((day, row) => {
            const x = leftPad + col * step
            const y = topPad + row * step
            return (
              <rect
                key={day.date}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                ry={2}
                fill={INTENSITY_COLORS[day.intensity]}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect()
                  const svgRect = (e.currentTarget as SVGRectElement).closest('svg')!.getBoundingClientRect()
                  setTooltip({
                    day,
                    x: rect.left - svgRect.left + cellSize / 2,
                    y: rect.top - svgRect.top,
                  })
                }}
              />
            )
          })
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-medium">{formatTooltipDate(tooltip.day.date)}</p>
          {tooltip.day.workout_count === 0 ? (
            <p className="text-gray-400 mt-0.5">No workout</p>
          ) : (
            <>
              <p className="text-green-400 mt-0.5">
                {tooltip.day.workout_count} workout{tooltip.day.workout_count > 1 ? 's' : ''}
              </p>
              {tooltip.day.titles.map((t, i) => (
                <p key={i} className="text-gray-300 truncate max-w-48">{t}</p>
              ))}
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-xs text-gray-400">Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{ width: 11, height: 11, backgroundColor: color, border: '1px solid rgba(0,0,0,0.06)' }}
          />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  )
}
