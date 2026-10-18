import type {
  ActiveSession,
  AppCategoryId,
  CatalogItem,
  Permission,
  SessionRecord,
} from '../types'
import { APP_CATALOG, CATALOG_BY_ID, ESSENTIAL_ITEM_IDS } from '../data/catalog'
import { clamp } from './format'

/* ── Timer maths ──────────────────────────────────────────────────────────── */

/** Elapsed focus time in ms, excluding every paused millisecond. */
export function elapsedMs(session: ActiveSession, now: number): number {
  if (!session) return 0
  const raw = now - session.startedAt - session.pausedMs
  const currentPause = session.pausedAt ? now - session.pausedAt : 0
  return Math.max(0, raw - currentPause)
}

export function plannedMs(session: ActiveSession): number {
  return session.plannedMinutes * 60_000
}

export function remainingMs(session: ActiveSession, now: number): number {
  return Math.max(0, plannedMs(session) - elapsedMs(session, now))
}

export function remainingSeconds(session: ActiveSession, now: number): number {
  return Math.round(remainingMs(session, now) / 1000)
}

export function elapsedSeconds(session: ActiveSession, now: number): number {
  return Math.floor(elapsedMs(session, now) / 1000)
}

/** 0 → 1 progress of the planned session. */
export function progressRatio(session: ActiveSession, now: number): number {
  const total = plannedMs(session)
  if (total <= 0) return 1
  return clamp(elapsedMs(session, now) / total, 0, 1)
}

/* ── Calendar helpers ─────────────────────────────────────────────────────── */

/** Local calendar day key (YYYY-MM-DD) for a timestamp. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function isSameDay(a: number, b: number): boolean {
  return dayKey(a) === dayKey(b)
}

export function focusMinutesOnDay(records: SessionRecord[], ts: number): number {
  const key = dayKey(ts)
  return records
    .filter((r) => dayKey(r.startedAt) === key)
    .reduce((sum, r) => sum + r.elapsedSeconds / 60, 0)
}

export function sessionCountOnDay(records: SessionRecord[], ts: number): number {
  const key = dayKey(ts)
  return records.filter((r) => dayKey(r.startedAt) === key).length
}

/**
 * Consecutive days with at least one completed session.
 * Today counts toward the streak only once a session is actually finished;
 * a streak that ran through yesterday is still "alive" until today ends.
 */
export function computeStreak(records: SessionRecord[], now = Date.now()): number {
  const completedDays = new Set(
    records.filter((r) => r.outcome === 'completed').map((r) => dayKey(r.startedAt)),
  )
  if (completedDays.size === 0) return 0

  let streak = 0
  let cursor = startOfDay(now)
  if (!completedDays.has(dayKey(cursor))) {
    cursor -= 86_400_000
    if (!completedDays.has(dayKey(cursor))) return 0
  }
  while (completedDays.has(dayKey(cursor))) {
    streak += 1
    cursor -= 86_400_000
  }
  return streak
}

export interface DayBucket {
  key: string
  label: string
  minutes: number
  sessions: number
  isToday: boolean
}

/** Focus minutes for the last `days` days, oldest first. */
export function weeklyBuckets(records: SessionRecord[], now = Date.now(), days = 7): DayBucket[] {
  const buckets: DayBucket[] = []
  const todayStart = startOfDay(now)
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const ts = todayStart - offset * 86_400_000
    const key = dayKey(ts)
    const dayRecords = records.filter((r) => dayKey(r.startedAt) === key)
    buckets.push({
      key,
      label: new Date(ts).toLocaleDateString([], { weekday: 'short' }).slice(0, 2),
      minutes: dayRecords.reduce((sum, r) => sum + r.elapsedSeconds / 60, 0),
      sessions: dayRecords.length,
      isToday: offset === 0,
    })
  }
  return buckets
}

export interface FocusTotals {
  totalMinutes: number
  totalSessions: number
  completedSessions: number
  earlySessions: number
  averageMinutes: number
  longestMinutes: number
  restrictedAttempts: number
}

export function computeTotals(records: SessionRecord[]): FocusTotals {
  const totalSeconds = records.reduce((sum, r) => sum + r.elapsedSeconds, 0)
  const completed = records.filter((r) => r.outcome === 'completed')
  return {
    totalMinutes: totalSeconds / 60,
    totalSessions: records.length,
    completedSessions: completed.length,
    earlySessions: records.length - completed.length,
    averageMinutes: records.length ? totalSeconds / 60 / records.length : 0,
    longestMinutes: records.length ? Math.max(...records.map((r) => r.elapsedSeconds / 60)) : 0,
    restrictedAttempts: records.reduce((sum, r) => sum + r.restrictedAttempts, 0),
  }
}

/**
 * A deliberately transparent, rule-based estimate.
 * It is NOT a measurement of concentration — it only reflects how many
 * simulated distraction attempts happened during the session and how much of
 * the planned block was completed.
 */
export function estimateFocusIndex(record: SessionRecord): number {
  const minutes = Math.max(0.25, record.elapsedSeconds / 60)
  const attemptsPerHour = record.restrictedAttempts / (minutes / 60)
  const penalty = Math.min(30, attemptsPerHour * 4)
  const completionBonus = record.outcome === 'completed' ? 10 : 0
  const planned = Math.max(1, record.plannedMinutes)
  const completionRatio = clamp((record.elapsedSeconds / 60) / planned, 0, 1)
  const unfinishedPenalty = (1 - completionRatio) * 15
  return Math.round(clamp(100 - penalty + completionBonus - unfinishedPenalty, 0, 100))
}

/* ── Permissions ──────────────────────────────────────────────────────────── */

/** Normal (non-session) permissions shipped with the demo. */
export function defaultPermissionMap(): Record<string, Permission> {
  const map: Record<string, Permission> = {}
  APP_CATALOG.forEach((item) => {
    if (item.essential) {
      map[item.id] = 'allowed'
      return
    }
    if (item.category === 'social' || item.category === 'games' || item.category === 'entertainment') {
      map[item.id] = 'restricted'
      return
    }
    if (item.category === 'communication') {
      map[item.id] = 'restricted'
      return
    }
    map[item.id] = 'neutral'
  })
  return map
}

/** Effective permission of an item while a session is running. */
export function sessionPermission(
  session: Pick<ActiveSession, 'allowed' | 'restricted'> | null,
  itemId: string,
): Permission {
  if (!session) return 'neutral'
  if (session.allowed.includes(itemId)) return 'allowed'
  if (session.restricted.includes(itemId)) return 'restricted'
  return 'neutral'
}

/**
 * Effective permission during a live session, taking Flexible Focus's
 * temporary allows into account.
 */
export function effectiveSessionPermission(
  session: ActiveSession | null,
  itemId: string,
  now = Date.now(),
): Permission {
  if (!session) return 'neutral'
  const temporary = session.temporaryAllows.find(
    (t) => t.itemId === itemId && t.until > now,
  )
  if (temporary) return 'allowed'
  return sessionPermission(session, itemId)
}

/** True when the item is temporarily allowed for legitimate academic use. */
export function isTemporarilyAllowed(
  session: ActiveSession | null,
  itemId: string,
  now = Date.now(),
): boolean {
  if (!session) return false
  return session.temporaryAllows.some((t) => t.itemId === itemId && t.until > now)
}

/**
 * In Strict Focus the essential academic tools are always reachable, even if
 * the user forgot to include them.
 */
export function withEssentialAllowed(ids: string[]): string[] {
  const set = new Set(ids)
  ESSENTIAL_ITEM_IDS.forEach((id) => set.add(id))
  return Array.from(set)
}

/** Items that are not allowed AND not restricted are simply not restricted. */
export function normaliseLists(
  allowed: string[],
  restricted: string[],
): { allowed: string[]; restricted: string[] } {
  const restrictedSet = new Set(restricted)
  return {
    allowed: Array.from(new Set(allowed)).filter((id) => !restrictedSet.has(id)),
    restricted: Array.from(restrictedSet),
  }
}

/* ── Validation ───────────────────────────────────────────────────────────── */

export const GOAL_MIN = 3
export const GOAL_MAX = 80
export const DURATION_MIN = 1
export const DURATION_MAX = 240

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateGoal(goal: string): ValidationResult {
  const trimmed = goal.trim()
  if (trimmed.length === 0) return { valid: false, error: 'Add a study goal so you know what you are working towards.' }
  if (trimmed.length < GOAL_MIN)
    return { valid: false, error: `Study goals need at least ${GOAL_MIN} characters.` }
  if (trimmed.length > GOAL_MAX)
    return { valid: false, error: `Keep the goal under ${GOAL_MAX} characters.` }
  return { valid: true }
}

export function validateDuration(minutes: number): ValidationResult {
  if (!Number.isFinite(minutes)) return { valid: false, error: 'Enter a valid duration.' }
  if (minutes < DURATION_MIN) return { valid: false, error: 'Duration must be at least 1 minute.' }
  if (minutes > DURATION_MAX) return { valid: false, error: 'Duration cannot exceed 240 minutes.' }
  return { valid: true }
}

/* ── Misc ─────────────────────────────────────────────────────────────────── */

export function itemsByIds(ids: string[]): CatalogItem[] {
  return ids
    .map((id) => CATALOG_BY_ID[id])
    .filter((item): item is CatalogItem => Boolean(item))
}

export function groupByCategory(ids: string[]): { id: AppCategoryId; items: CatalogItem[] }[] {
  const items = itemsByIds(ids)
  const groups: { id: AppCategoryId; items: CatalogItem[] }[] = []
  const order: AppCategoryId[] = [
    'education',
    'productivity',
    'communication',
    'social',
    'games',
    'entertainment',
  ]
  order.forEach((id) => {
    const group = items.filter((item) => item.category === id)
    if (group.length) groups.push({ id, items: group })
  })
  return groups
}
