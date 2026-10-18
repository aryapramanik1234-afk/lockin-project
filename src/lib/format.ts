/** Small, dependency-free formatting helpers used across the UI. */

/** 25 → "25 min", 90 → "1h 30m" */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** 7549 → "125:49" */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** 7549 → "2h 5m" */
export function formatDurationLong(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatHourMinutes(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds / 60))
  return formatMinutes(safe)
}

export function formatClockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatFullDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRelative(ts: number, now = Date.now()): string {
  const diff = Math.round((now - ts) / 1000)
  if (diff < 45) return 'just now'
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  const days = Math.round(diff / 86400)
  if (days < 7) return `${days}d ago`
  return formatDate(ts)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function percent(value: number, total: number): number {
  if (total <= 0) return 0
  return clamp(Math.round((value / total) * 100), 0, 100)
}
