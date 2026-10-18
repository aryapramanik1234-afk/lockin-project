import type {
  ActiveSession,
  AppNotification,
  Permission,
  SessionRecord,
  Settings,
} from '../types'
import { defaultPermissionMap } from '../lib/session'

export interface ToastMessage {
  id: string
  title: string
  body?: string
  kind: 'success' | 'info' | 'warning' | 'error'
}

export interface AppState {
  settings: Settings
  history: SessionRecord[]
  permissions: Record<string, Permission>
  activeSession: ActiveSession | null
  notifications: AppNotification[]
  /** Time-boxed allow rules that apply to the next Flexible session. */
  temporaryAllows: { itemId: string; until: number }[]
  /** Id of the most recently produced session report. */
  lastRecordId: string | null
  hydrated: boolean
}

export const defaultSettings: Settings = {
  theme: 'dark',
  defaultDurationMinutes: 45,
  defaultMode: 'flexible',
  defaultAllowed: [
    'calculator',
    'notes',
    'pdf-reader',
    'dictionary',
    'google-classroom',
    'google-docs',
    'wikipedia',
  ],
  defaultRestricted: [
    'youtube',
    'instagram',
    'facebook',
    'x-twitter',
    'reddit',
    'tiktok',
    'discord',
    'whatsapp',
    'netflix',
    'twitch',
    'spotify',
    'steam',
    'roblox',
    'mobile-games',
  ],
  inAppNotifications: true,
  completionChime: true,
  showSimulatedBanner: true,
}

export function createInitialState(): AppState {
  return {
    settings: defaultSettings,
    history: [],
    permissions: defaultPermissionMap(),
    activeSession: null,
    notifications: [],
    temporaryAllows: [],
    lastRecordId: null,
    hydrated: false,
  }
}

export type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_PERMISSION'; itemId: string; permission: Permission }
  | { type: 'SET_PERMISSIONS'; payload: Record<string, Permission> }
  | { type: 'START_SESSION'; session: ActiveSession }
  | { type: 'PAUSE_SESSION'; at: number }
  | { type: 'RESUME_SESSION'; at: number }
  | { type: 'END_SESSION'; record: SessionRecord }
  | { type: 'DISCARD_SESSION' }
  | { type: 'ADD_ATTEMPT'; itemId: string; itemName: string; category: SessionRecord['attempts'][number]['category']; at: number; temporarilyAllowed?: boolean }
  | { type: 'CLEAR_ATTEMPTS' }
  | { type: 'SET_SESSION_PERMISSION'; itemId: string; permission: Permission }
  | { type: 'TEMPORARY_ALLOW'; itemId: string; until: number }
  | { type: 'GRANT_TEMPORARY_ALLOW'; itemId: string; until: number }
  | { type: 'REVOKE_TEMPORARY_ALLOW'; itemId: string }
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'DELETE_RECORD'; id: string }
  | { type: 'LOAD_SAMPLE_DATA'; records: SessionRecord[] }
  | { type: 'CLEAR_LAST_RECORD' }
  | { type: 'RESET_ALL' }

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'SET_PERMISSION':
      return {
        ...state,
        permissions: { ...state.permissions, [action.itemId]: action.permission },
      }

    case 'SET_PERMISSIONS':
      return { ...state, permissions: { ...action.payload } }

    case 'START_SESSION':
      return {
        ...state,
        activeSession: {
          ...action.session,
          temporaryAllows: action.session.temporaryAllows.length
            ? action.session.temporaryAllows
            : state.temporaryAllows.filter((t) => t.until > Date.now()),
        },
        lastRecordId: null,
      }

    case 'PAUSE_SESSION': {
      if (!state.activeSession || state.activeSession.status !== 'running') return state
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          status: 'paused',
          pausedAt: action.at,
        },
      }
    }

    case 'RESUME_SESSION': {
      if (!state.activeSession || state.activeSession.status !== 'paused') return state
      const pausedFor = action.at - (state.activeSession.pausedAt ?? action.at)
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          status: 'running',
          pausedMs: state.activeSession.pausedMs + Math.max(0, pausedFor),
          pausedAt: null,
        },
      }
    }

    case 'END_SESSION':
      return {
        ...state,
        activeSession: null,
        lastRecordId: action.record.id,
        history: [action.record, ...state.history],
      }

    case 'DISCARD_SESSION':
      return { ...state, activeSession: null }

    case 'ADD_ATTEMPT': {
      if (!state.activeSession) return state
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          attempts: [
            ...state.activeSession.attempts,
            {
              itemId: action.itemId,
              itemName: action.itemName,
              category: action.category,
              at: action.at,
              temporarilyAllowed: action.temporarilyAllowed ?? false,
            },
          ],
        },
      }
    }

    case 'CLEAR_ATTEMPTS':
      if (!state.activeSession) return state
      return { ...state, activeSession: { ...state.activeSession, attempts: [] } }

    case 'SET_SESSION_PERMISSION': {
      if (!state.activeSession) return state
      const session = state.activeSession
      const allowed = session.allowed.filter((id) => id !== action.itemId)
      const restricted = session.restricted.filter((id) => id !== action.itemId)
      if (action.permission === 'allowed') allowed.push(action.itemId)
      if (action.permission === 'restricted') restricted.push(action.itemId)
      return {
        ...state,
        activeSession: {
          ...session,
          allowed,
          restricted,
          temporaryAllows: session.temporaryAllows.filter((t) => t.itemId !== action.itemId),
        },
      }
    }

    case 'TEMPORARY_ALLOW': {
      if (!state.activeSession) return state
      const session = state.activeSession
      return {
        ...state,
        activeSession: {
          ...session,
          temporaryAllows: [
            ...session.temporaryAllows.filter((t) => t.itemId !== action.itemId),
            { itemId: action.itemId, until: action.until },
          ],
        },
      }
    }

    case 'GRANT_TEMPORARY_ALLOW': {
      const next = [
        ...state.temporaryAllows.filter((t) => t.itemId !== action.itemId),
        { itemId: action.itemId, until: action.until },
      ]
      return { ...state, temporaryAllows: next }
    }

    case 'REVOKE_TEMPORARY_ALLOW':
      return {
        ...state,
        temporaryAllows: state.temporaryAllows.filter((t) => t.itemId !== action.itemId),
      }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.notification, ...state.notifications].slice(0, 30) }

    case 'MARK_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }

    case 'DELETE_RECORD':
      return { ...state, history: state.history.filter((r) => r.id !== action.id) }

    case 'CLEAR_LAST_RECORD':
      return { ...state, lastRecordId: null }

    case 'LOAD_SAMPLE_DATA':
      return { ...state, history: action.records, lastRecordId: null }

    case 'RESET_ALL':
      return { ...createInitialState(), hydrated: true }

    default:
      return state
  }
}

/* ── Persisted payload sanitising ────────────────────────────────────────── */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function sanitizeSettings(input: unknown): Partial<Settings> {
  if (!isRecord(input)) return {}
  const out: Partial<Settings> = {}
  if (input.theme === 'dark' || input.theme === 'light' || input.theme === 'system') {
    out.theme = input.theme
  }
  if (typeof input.defaultDurationMinutes === 'number' && input.defaultDurationMinutes > 0) {
    out.defaultDurationMinutes = input.defaultDurationMinutes
  }
  if (input.defaultMode === 'flexible' || input.defaultMode === 'strict') {
    out.defaultMode = input.defaultMode
  }
  if (Array.isArray(input.defaultAllowed)) {
    out.defaultAllowed = input.defaultAllowed.filter((v): v is string => typeof v === 'string')
  }
  if (Array.isArray(input.defaultRestricted)) {
    out.defaultRestricted = input.defaultRestricted.filter((v): v is string => typeof v === 'string')
  }
  if (typeof input.inAppNotifications === 'boolean') out.inAppNotifications = input.inAppNotifications
  if (typeof input.completionChime === 'boolean') out.completionChime = input.completionChime
  if (typeof input.showSimulatedBanner === 'boolean') out.showSimulatedBanner = input.showSimulatedBanner
  return out
}

export function sanitizeHistory(input: unknown): SessionRecord[] {
  if (!Array.isArray(input)) return []
  return input.filter((item): item is SessionRecord => {
    if (!isRecord(item)) return false
    return (
      typeof item.id === 'string' &&
      typeof item.goal === 'string' &&
      (item.mode === 'flexible' || item.mode === 'strict') &&
      typeof item.plannedMinutes === 'number' &&
      typeof item.elapsedSeconds === 'number' &&
      typeof item.startedAt === 'number' &&
      typeof item.endedAt === 'number' &&
      (item.outcome === 'completed' || item.outcome === 'ended-early') &&
      Array.isArray(item.attempts)
    )
  })
}

export function sanitizePermissions(input: unknown): Record<string, Permission> {
  if (!isRecord(input)) return {}
  const out: Record<string, Permission> = {}
  Object.entries(input).forEach(([key, value]) => {
    if (value === 'allowed' || value === 'restricted' || value === 'neutral') {
      out[key] = value
    }
  })
  return out
}

export function sanitizeActiveSession(input: unknown): ActiveSession | null {
  if (!isRecord(input)) return null
  if (typeof input.id !== 'string' || typeof input.startedAt !== 'number') return null
  const status = input.status
  if (status !== 'running' && status !== 'paused' && status !== 'finished') return null
  return {
    id: input.id,
    goal: typeof input.goal === 'string' ? input.goal : 'Focus session',
    mode: input.mode === 'strict' ? 'strict' : 'flexible',
    plannedMinutes:
      typeof input.plannedMinutes === 'number' && input.plannedMinutes > 0
        ? input.plannedMinutes
        : 25,
    startedAt: input.startedAt,
    pausedMs: typeof input.pausedMs === 'number' ? Math.max(0, input.pausedMs) : 0,
    pausedAt: typeof input.pausedAt === 'number' ? input.pausedAt : null,
    status,
    allowed: Array.isArray(input.allowed)
      ? input.allowed.filter((v): v is string => typeof v === 'string')
      : [],
    restricted: Array.isArray(input.restricted)
      ? input.restricted.filter((v): v is string => typeof v === 'string')
      : [],
    attempts: Array.isArray(input.attempts) ? (input.attempts as ActiveSession['attempts']) : [],
    temporaryAllows: Array.isArray(input.temporaryAllows)
      ? (input.temporaryAllows as ActiveSession['temporaryAllows'])
      : [],
  }
}
