/**
 * LockIn — shared domain types.
 *
 * Everything in LockIn is a *simulation*. The app models a phone/OS-level
 * blocker in the browser so that the workflow can be demonstrated honestly
 * without claiming capabilities the web platform does not have.
 */

export type FocusMode = 'flexible' | 'strict'

/** How a catalog item is treated in the simulated environment. */
export type Permission = 'allowed' | 'restricted' | 'neutral'

export type AppKind = 'app' | 'website'

export type AppCategoryId =
  | 'education'
  | 'productivity'
  | 'communication'
  | 'social'
  | 'games'
  | 'entertainment'

export interface AppCategory {
  id: AppCategoryId
  label: string
  description: string
  /** Tailwind-ish hue used for the category chip. */
  hue: number
}

export interface CatalogItem {
  id: string
  name: string
  category: AppCategoryId
  kind: AppKind
  /** Domain shown for website entries. */
  domain?: string
  /** Essential academic tools stay available even in Strict Focus. */
  essential?: boolean
  description: string
  /** Key into the Lucide icon registry. */
  icon: string
  /** Accent colour (hex) used for the icon tile. */
  accent: string
}

/** A recorded attempt to open a restricted item during a session. */
export interface BlockAttempt {
  itemId: string
  itemName: string
  category: AppCategoryId
  at: number
  /** True when the item was temporarily allowed for legitimate academic use. */
  temporarilyAllowed: boolean
}

export type SessionOutcome = 'completed' | 'ended-early'

export interface SessionRecord {
  id: string
  goal: string
  mode: FocusMode
  plannedMinutes: number
  /** Actual elapsed time in seconds (paused time excluded). */
  elapsedSeconds: number
  startedAt: number
  endedAt: number
  outcome: SessionOutcome
  /** Number of simulated restricted-item attempts. */
  restrictedAttempts: number
  attempts: BlockAttempt[]
  allowedCount: number
  restrictedCount: number
}

export type ActiveStatus = 'running' | 'paused' | 'finished'

export interface ActiveSession {
  id: string
  goal: string
  mode: FocusMode
  plannedMinutes: number
  /** Epoch ms of the first start. */
  startedAt: number
  /** Total paused duration in ms, accumulated across pauses. */
  pausedMs: number
  /** Epoch ms when the current pause began (null when running). */
  pausedAt: number | null
  status: ActiveStatus
  allowed: string[]
  restricted: string[]
  attempts: BlockAttempt[]
  /** Flexible Focus: items temporarily allowed until a timestamp. */
  temporaryAllows: { itemId: string; until: number }[]
}

export type ThemePreference = 'dark' | 'light' | 'system'

export interface Settings {
  theme: ThemePreference
  defaultDurationMinutes: number
  defaultMode: FocusMode
  /** Session defaults (ids of catalog items). */
  defaultAllowed: string[]
  defaultRestricted: string[]
  inAppNotifications: boolean
  completionChime: boolean
  /** Show the in-product explainer about simulated enforcement. */
  showSimulatedBanner: boolean
}

export interface Permissions {
  /** itemId -> permission, only for non-neutral entries. */
  [itemId: string]: Permission
}

export interface AppNotification {
  id: string
  title: string
  body: string
  at: number
  kind: 'success' | 'info' | 'warning'
  read: boolean
}

export interface SessionDraft {
  goal: string
  mode: FocusMode
  durationMinutes: number
  allowed: string[]
  restricted: string[]
}
