import type { BlockAttempt, SessionRecord } from '../types'
import { getCatalogItem } from '../data/catalog'

interface SampleTemplate {
  goal: string
  dayOffset: number
  hour: number
  plannedMinutes: number
  mode: 'flexible' | 'strict'
  outcome: 'completed' | 'ended-early'
  elapsedRatio: number
  attempts: { itemId: string; minutesIn: number }[]
}

/**
 * A small, deterministic set of realistic sessions.
 *
 * It exists so the dashboard, chart and reports can be demonstrated with
 * believable data on a fresh install. Every value here is clearly synthetic —
 * a user can wipe it at any time from Settings.
 */
const TEMPLATES: SampleTemplate[] = [
  {
    goal: 'Finish calculus problem set',
    dayOffset: 0,
    hour: 9,
    plannedMinutes: 45,
    mode: 'flexible',
    outcome: 'completed',
    elapsedRatio: 1,
    attempts: [{ itemId: 'instagram', minutesIn: 12 }],
  },
  {
    goal: 'Revise organic chemistry notes',
    dayOffset: 0,
    hour: 14,
    plannedMinutes: 25,
    mode: 'strict',
    outcome: 'completed',
    elapsedRatio: 1,
    attempts: [],
  },
  {
    goal: 'Read research paper — chapter 3',
    dayOffset: 1,
    hour: 10,
    plannedMinutes: 60,
    mode: 'flexible',
    outcome: 'completed',
    elapsedRatio: 1,
    attempts: [
      { itemId: 'youtube', minutesIn: 8 },
      { itemId: 'discord', minutesIn: 26 },
    ],
  },
  {
    goal: 'Write literature review draft',
    dayOffset: 1,
    hour: 19,
    plannedMinutes: 90,
    mode: 'strict',
    outcome: 'ended-early',
    elapsedRatio: 0.62,
    attempts: [],
  },
  {
    goal: 'Prepare for data structures quiz',
    dayOffset: 2,
    hour: 8,
    plannedMinutes: 45,
    mode: 'flexible',
    outcome: 'completed',
    elapsedRatio: 1,
    attempts: [{ itemId: 'reddit', minutesIn: 31 }],
  },
  {
    goal: 'Linear algebra problem sheet',
    dayOffset: 3,
    hour: 11,
    plannedMinutes: 60,
    mode: 'flexible',
    outcome: 'completed',
    elapsedRatio: 1,
    attempts: [],
  },
  {
    goal: 'Statistics — hypothesis tests',
    dayOffset: 4,
    hour: 16,
    plannedMinutes: 25,
    mode: 'strict',
    outcome: 'completed',
    elapsedRatio: 1,
    attempts: [],
  },
  {
    goal: 'Summarise two research papers',
    dayOffset: 5,
    hour: 13,
    plannedMinutes: 90,
    mode: 'flexible',
    outcome: 'ended-early',
    elapsedRatio: 0.45,
    attempts: [
      { itemId: 'netflix', minutesIn: 19 },
      { itemId: 'tiktok', minutesIn: 22 },
    ],
  },
  {
    goal: 'Review week 6 lecture slides',
    dayOffset: 6,
    hour: 10,
    plannedMinutes: 45,
    mode: 'flexible',
    outcome: 'completed',
    elapsedRatio: 1,
    attempts: [{ itemId: 'whatsapp', minutesIn: 14 }],
  },
]

function atHour(base: number, dayOffset: number, hour: number): number {
  const date = new Date(base)
  date.setDate(date.getDate() - dayOffset)
  date.setHours(hour, 15, 0, 0)
  return date.getTime()
}

export function createSampleSessions(now = Date.now()): SessionRecord[] {
  return TEMPLATES.map((template, index) => {
    const startedAt = atHour(now, template.dayOffset, template.hour)
    const plannedSeconds = template.plannedMinutes * 60
    const elapsedSeconds = Math.round(plannedSeconds * template.elapsedRatio)
    const endedAt = startedAt + elapsedSeconds * 1000
    const attempts: BlockAttempt[] = template.attempts.map((attempt) => {
      const item = getCatalogItem(attempt.itemId)
      return {
        itemId: attempt.itemId,
        itemName: item?.name ?? attempt.itemId,
        category: item?.category ?? 'entertainment',
        at: startedAt + attempt.minutesIn * 60_000,
        temporarilyAllowed: false,
      }
    })

    return {
      id: `sample-${index + 1}`,
      goal: template.goal,
      mode: template.mode,
      plannedMinutes: template.plannedMinutes,
      elapsedSeconds,
      startedAt,
      endedAt,
      outcome: template.outcome,
      restrictedAttempts: attempts.length,
      attempts,
      allowedCount: 7,
      restrictedCount: 13,
    }
  }).sort((a, b) => b.startedAt - a.startedAt)
}
