import { useEffect, useRef, useState } from 'react'
import type { DayBucket } from '../../lib/session'

export interface WeeklyFocusChartProps {
  data: DayBucket[]
  goalMinutes?: number
  height?: number
}

const PAD = { top: 30, right: 12, bottom: 34, left: 42 }

function niceMax(value: number): number {
  if (value <= 0) return 60
  const steps = [30, 60, 90, 120, 180, 240, 300, 360, 480, 600]
  const found = steps.find((step) => step >= value)
  return found ?? Math.ceil(value / 60) * 60
}

export function WeeklyFocusChart({ data, goalMinutes, height = 250 }: WeeklyFocusChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)

  // The chart is drawn at the real pixel width of its container so it always
  // fills the card instead of floating in the middle of it.
  useEffect(() => {
    const element = wrapRef.current
    if (!element) return undefined
    const measure = () => setWidth(Math.max(300, Math.round(element.clientWidth)))
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const max = niceMax(Math.max(goalMinutes ?? 0, ...data.map((d) => d.minutes)))
  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const band = innerW / Math.max(1, data.length)
  const barWidth = Math.min(46, band * 0.46)
  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div style={{ width: '100%' }} ref={wrapRef}>
      <svg
        className="chart"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ maxWidth: '100%' }}
        role="img"
        aria-label="Weekly focus minutes chart"
      >
        <defs>
          <linearGradient id="lockin-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="lockin-bar-today" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-hover)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => {
          const y = PAD.top + innerH - line * innerH
          return (
            <g key={line}>
              <line
                className="chart-grid-line"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
              />
              <text className="chart-label" x={PAD.left - 8} y={y + 4} textAnchor="end">
                {Math.round(max * line)}m
              </text>
            </g>
          )
        })}

        {goalMinutes && goalMinutes > 0 ? (
          <g>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={PAD.top + innerH - (goalMinutes / max) * innerH}
              y2={PAD.top + innerH - (goalMinutes / max) * innerH}
              stroke="var(--warning)"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.55}
            />
            <text
              className="chart-label"
              x={width - PAD.right}
              y={PAD.top + innerH - (goalMinutes / max) * innerH - 6}
              textAnchor="end"
              fill="var(--warning)"
            >
              daily goal
            </text>
          </g>
        ) : null}

        {data.map((day, index) => {
          const x = PAD.left + band * index + band / 2
          const ratio = max > 0 ? Math.min(1, day.minutes / max) : 0
          const barHeight = Math.max(day.minutes > 0 ? 4 : 0, ratio * innerH)
          const y = PAD.top + innerH - barHeight
          const isHovered = hovered === index
          return (
            <g
              key={day.key}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              role="listitem"
              aria-label={`${day.label}: ${Math.round(day.minutes)} focus minutes across ${day.sessions} sessions`}
            >
              <rect
                x={x - band / 2}
                y={PAD.top}
                width={band}
                height={innerH}
                fill={isHovered ? 'var(--surface-inset)' : 'transparent'}
                rx={10}
                style={{ cursor: 'default' }}
              />
              {barHeight > 0 ? (
                <rect
                  className="chart-bar"
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={Math.min(8, barWidth / 2)}
                  fill={day.isToday ? 'url(#lockin-bar-today)' : 'url(#lockin-bar)'}
                  opacity={hovered === null || isHovered ? 1 : 0.45}
                />
              ) : null}
              <text
                className="chart-label"
                x={x}
                y={PAD.top + innerH + 20}
                textAnchor="middle"
                fill={day.isToday ? 'var(--accent-text)' : undefined}
                style={{ fontWeight: day.isToday ? 600 : 400 }}
              >
                {day.label}
              </text>
              {day.minutes > 0 ? (
                <text
                  className="chart-value"
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  opacity={hovered === null || isHovered ? 1 : 0}
                >
                  {Math.round(day.minutes)}m
                </text>
              ) : null}
              {isHovered ? (
                <g>
                  <rect
                    x={x - 46}
                    y={PAD.top - 24}
                    width={92}
                    height={20}
                    rx={6}
                    fill="var(--surface-3)"
                    stroke="var(--border-strong)"
                  />
                  <text className="chart-tooltip" x={x} y={PAD.top - 10} textAnchor="middle">
                    {Math.round(day.minutes)}m · {day.sessions} sess.
                  </text>
                </g>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
