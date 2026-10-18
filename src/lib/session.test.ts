import { describe, expect, it } from 'vitest'
import {
  computeStreak,
  computeTotals,
  dayKey,
  defaultPermissionMap,
  effectiveSessionPermission,
  elapsedMs,
  estimateFocusIndex,
  isTemporarilyAllowed,
  normaliseLists,
  progressRatio,
  remainingMs,
  remainingSeconds,
  validateDuration,
  validateGoal,
  weeklyBuckets,
  withEssentialAllowed,
} from './session'
import type { ActiveSession, SessionRecord } from '../types'

function makeSession(overrides: Partial<ActiveSession> = {}): ActiveSession {
  return {
    id: 'session-1',
    goal: 'Test session',
    mode: 'flexible',
    plannedMinutes: 25,
    startedAt: 1_000_000,
    pausedMs: 0,
    pausedAt: null,
    status: 'running',
    allowed: ['notes'],
    restricted: ['youtube'],
    attempts: [],
    temporaryAllows: [],
    ...overrides,
  }
}

function makeRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'record-1',
    goal: 'Test session',
    mode: 'flexible',
    plannedMinutes: 25,
    elapsedSeconds: 1500,
    startedAt: 1_000_000,
    endedAt: 1_001_500,
    outcome: 'completed',
    restrictedAttempts: 0,
    attempts: [],
    allowedCount: 3,
    restrictedCount: 5,
    ...overrides,
  }
}

describe('timer maths', () => {
  it('counts down from the wall clock rather than a decrementing counter', () => {
    const session = makeSession({ startedAt: 0 })
    expect(elapsedMs(session, 60_000)).toBe(60_000)
    expect(remainingMs(session, 60_000)).toBe(25 * 60_000 - 60_000)
    expect(remainingSeconds(session, 60_000)).toBe(24 * 60)
  })

  it('excludes paused time from the elapsed total', () => {
    const session = makeSession({ startedAt: 0, pausedMs: 30_000, pausedAt: 60_000 })
    // 90s of wall clock, 30s already paused + 30s of the current pause = 30s of focus
    expect(elapsedMs(session, 90_000)).toBe(30_000)
  })

  it('never reports negative remaining time', () => {
    const session = makeSession({ startedAt: 0 })
    expect(remainingMs(session, 999 * 60_000)).toBe(0)
    expect(progressRatio(session, 999 * 60_000)).toBe(1)
  })

  it('reports progress between zero and one', () => {
    const session = makeSession({ startedAt: 0 })
    expect(progressRatio(session, 0)).toBe(0)
    expect(progressRatio(session, 25 * 60_000 / 2)).toBeCloseTo(0.5, 5)
  })
})

describe('streaks and buckets', () => {
  const base = new Date('2024-05-14T10:00:00').getTime()

  it('counts consecutive days with completed sessions', () => {
    const records = [
      makeRecord({ startedAt: base }),
      makeRecord({ startedAt: base - 86_400_000 }),
      makeRecord({ startedAt: base - 2 * 86_400_000 }),
    ]
    expect(computeStreak(records, base)).toBe(3)
  })

  it('breaks the streak after a missed day', () => {
    const records = [
      makeRecord({ startedAt: base }),
      makeRecord({ startedAt: base - 2 * 86_400_000 }),
    ]
    expect(computeStreak(records, base)).toBe(1)
  })

  it('keeps a streak alive when today has not been studied yet', () => {
    const records = [makeRecord({ startedAt: base - 86_400_000 })]
    expect(computeStreak(records, base)).toBe(1)
  })

  it('ignores sessions that ended early for the streak', () => {
    const records = [makeRecord({ startedAt: base, outcome: 'ended-early' })]
    expect(computeStreak(records, base)).toBe(0)
  })

  it('builds seven ordered daily buckets with the real recorded minutes', () => {
    const records = [makeRecord({ startedAt: base, elapsedSeconds: 600 })]
    const buckets = weeklyBuckets(records, base, 7)
    expect(buckets).toHaveLength(7)
    expect(buckets[6]?.minutes).toBeCloseTo(10, 5)
    expect(buckets[6]?.isToday).toBe(true)
    expect(buckets[0]?.minutes).toBe(0)
  })

  it('uses a stable local day key', () => {
    const ts = new Date('2024-05-14T23:30:00').getTime()
    expect(dayKey(ts)).toBe('2024-05-14')
  })
})

describe('totals and estimates', () => {
  it('aggregates totals from the records', () => {
    const totals = computeTotals([
      makeRecord({ elapsedSeconds: 600, outcome: 'completed' }),
      makeRecord({ elapsedSeconds: 300, outcome: 'ended-early', restrictedAttempts: 2 }),
    ])
    expect(totals.totalSessions).toBe(2)
    expect(totals.completedSessions).toBe(1)
    expect(totals.earlySessions).toBe(1)
    expect(totals.totalMinutes).toBeCloseTo(15, 5)
    expect(totals.restrictedAttempts).toBe(2)
  })

  it('produces an index that is only derived from attempts and outcome', () => {
    const clean = estimateFocusIndex(makeRecord({ restrictedAttempts: 0 }))
    const noisy = estimateFocusIndex(makeRecord({ restrictedAttempts: 12 }))
    expect(clean).toBeGreaterThan(noisy)
    expect(clean).toBeLessThanOrEqual(100)
    expect(noisy).toBeGreaterThanOrEqual(0)
  })
})

describe('permissions', () => {
  it('ships a sensible default map', () => {
    const map = defaultPermissionMap()
    expect(map['calculator']).toBe('allowed')
    expect(map['youtube']).toBe('restricted')
    expect(map['google-docs']).toBe('allowed')
  })

  it('removes duplicates and resolves conflicts', () => {
    const result = normaliseLists(['a', 'b', 'b'], ['b', 'c'])
    expect(result.allowed).toEqual(['a'])
    expect(result.restricted.sort()).toEqual(['b', 'c'])
  })

  it('always keeps essential academic tools available', () => {
    const result = withEssentialAllowed(['notes'])
    expect(result).toContain('calculator')
    expect(result).toContain('notes')
  })

  it('treats an expired temporary allowance as restricted again', () => {
    const now = 10_000
    const session = makeSession({
      temporaryAllows: [{ itemId: 'youtube', until: now + 60_000 }],
    })
    expect(effectiveSessionPermission(session, 'youtube', now)).toBe('allowed')
    expect(isTemporarilyAllowed(session, 'youtube', now)).toBe(true)
    expect(effectiveSessionPermission(session, 'youtube', now + 61_000)).toBe('restricted')
    expect(isTemporarilyAllowed(session, 'youtube', now + 61_000)).toBe(false)
  })
})

describe('validation', () => {
  it('validates the study goal', () => {
    expect(validateGoal('').valid).toBe(false)
    expect(validateGoal('ab').valid).toBe(false)
    expect(validateGoal('Revise notes').valid).toBe(true)
    expect(validateGoal('x'.repeat(200)).valid).toBe(false)
  })

  it('validates the duration', () => {
    expect(validateDuration(0).valid).toBe(false)
    expect(validateDuration(25).valid).toBe(true)
    expect(validateDuration(241).valid).toBe(false)
    expect(validateDuration(Number.NaN).valid).toBe(false)
  })
})
