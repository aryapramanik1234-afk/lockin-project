import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  ActiveSession,
  AppNotification,
  CatalogItem,
  Permission,
  SessionOutcome,
  SessionRecord,
  SessionDraft,
  Settings,
} from '../types'
import {
  reducer,
  createInitialState,
  sanitizeActiveSession,
  sanitizeHistory,
  sanitizePermissions,
  sanitizeSettings,
  type AppState,
  type ToastMessage,
} from './app-context'
import {
  STORAGE_KEYS,
  clearAllStorage,
  readStorage,
  writeStorage,
} from '../lib/storage'
import {
  elapsedSeconds,
  normaliseLists,
  remainingMs,
  withEssentialAllowed,
} from '../lib/session'
import { playCompletionChime } from '../lib/chime'
import { createSampleSessions } from '../lib/sampleData'
import { pluralize } from '../lib/format'

export interface AppActions {
  startSession: (draft: SessionDraft) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: (outcome: SessionOutcome) => SessionRecord | null
  discardSession: () => void
  recordAttempt: (item: CatalogItem, temporarilyAllowed?: boolean) => void
  setSessionPermission: (itemId: string, permission: Permission) => void
  temporarilyAllow: (itemId: string, minutes: number) => void
  grantTemporaryAllow: (itemId: string, minutes: number) => void
  revokeTemporaryAllow: (itemId: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  setPermission: (itemId: string, permission: Permission) => void
  setPermissions: (map: Record<string, Permission>) => void
  deleteRecord: (id: string) => void
  loadSampleData: () => void
  clearLastRecord: () => void
  resetAll: () => void
  notify: (title: string, body: string, kind?: AppNotification['kind']) => void
  markNotificationsRead: () => void
  clearNotifications: () => void
  dismissToast: (id: string) => void
}

export interface AppContextValue {
  state: AppState
  actions: AppActions
  toasts: ToastMessage[]
  /** Resolved theme after applying the "system" preference. */
  resolvedTheme: 'dark' | 'light'
}

export const AppContext = createContext<AppContextValue | null>(null)

let counter = 0
function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}

function buildRecord(
  session: ActiveSession,
  outcome: SessionOutcome,
  now: number,
): SessionRecord {
  // A session that was completed while the app was closed is capped at the
  // planned duration, and it is stamped with the moment it was *meant* to end
  // rather than the moment the user came back.
  const theoreticalEnd = session.startedAt + session.pausedMs + session.plannedMinutes * 60_000
  const endedAt = outcome === 'completed' ? Math.min(now, theoreticalEnd) : now
  const elapsed = Math.min(elapsedSeconds(session, now), session.plannedMinutes * 60)
  return {
    id: session.id,
    goal: session.goal,
    mode: session.mode,
    plannedMinutes: session.plannedMinutes,
    elapsedSeconds: elapsed,
    startedAt: session.startedAt,
    endedAt,
    outcome,
    restrictedAttempts: session.attempts.length,
    attempts: [...session.attempts],
    allowedCount: session.allowed.length,
    restrictedCount: session.restricted.length,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : 'dark',
  )

  const stateRef = useRef(state)
  stateRef.current = state
  const toastIdRef = useRef(0)

  /* ── Hydration ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const settings = sanitizeSettings(readStorage<unknown>(STORAGE_KEYS.settings, null))
    const history = sanitizeHistory(readStorage<unknown>(STORAGE_KEYS.history, []))
    const permissions = sanitizePermissions(
      readStorage<unknown>(STORAGE_KEYS.permissions, null),
    )
    const activeSession = sanitizeActiveSession(
      readStorage<unknown>(STORAGE_KEYS.activeSession, null),
    )
    const notifications = readStorage<AppNotification[]>(STORAGE_KEYS.notifications, [])
    const temporaryAllows = readStorage<{ itemId: string; until: number }[]>(
      STORAGE_KEYS.temporaryAllows,
      [],
    )

    dispatch({
      type: 'HYDRATE',
      payload: {
        settings: { ...createInitialState().settings, ...settings },
        history,
        permissions: Object.keys(permissions).length
          ? permissions
          : createInitialState().permissions,
        activeSession,
        notifications: Array.isArray(notifications) ? notifications : [],
        temporaryAllows: Array.isArray(temporaryAllows) ? temporaryAllows : [],
      },
    })
  }, [])

  /* ── Reconciliation of a session interrupted by a refresh ───────────────── */
  const hydrationDone = useRef(false)
  useEffect(() => {
    if (!state.hydrated) return
    if (hydrationDone.current) return
    hydrationDone.current = true

    const session = stateRef.current.activeSession
    if (!session) return
    if (session.status === 'running' && remainingMs(session, Date.now()) <= 0) {
      const now = Date.now()
      const record = buildRecord(session, 'completed', now)
      dispatch({ type: 'END_SESSION', record })
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: {
          id: uid('note'),
          title: 'Session finished while you were away',
          body: `Your "${session.goal}" session was completed for you.`,
          at: now,
          kind: 'success',
          read: false,
        },
      })
    }
  }, [state.hydrated])

  /* ── Persistence ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!state.hydrated) return
    writeStorage(STORAGE_KEYS.settings, state.settings)
  }, [state.settings, state.hydrated])

  useEffect(() => {
    if (!state.hydrated) return
    writeStorage(STORAGE_KEYS.history, state.history)
  }, [state.history, state.hydrated])

  useEffect(() => {
    if (!state.hydrated) return
    writeStorage(STORAGE_KEYS.permissions, state.permissions)
  }, [state.permissions, state.hydrated])

  useEffect(() => {
    if (!state.hydrated) return
    if (state.activeSession) {
      writeStorage(STORAGE_KEYS.activeSession, state.activeSession)
    } else {
      writeStorage(STORAGE_KEYS.activeSession, null)
    }
  }, [state.activeSession, state.hydrated])

  useEffect(() => {
    if (!state.hydrated) return
    writeStorage(STORAGE_KEYS.notifications, state.notifications)
  }, [state.notifications, state.hydrated])

  useEffect(() => {
    if (!state.hydrated) return
    writeStorage(STORAGE_KEYS.temporaryAllows, state.temporaryAllows)
  }, [state.temporaryAllows, state.hydrated])

  /* ── Theme ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? 'light' : 'dark')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolvedTheme: 'dark' | 'light' =
    state.settings.theme === 'system' ? systemTheme : state.settings.theme

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#0b0d14' : '#f6f7fb')
  }, [resolvedTheme])

  /* ── Toasts ────────────────────────────────────────────────────────────── */
  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    toastIdRef.current += 1
    const id = `toast-${toastIdRef.current}`
    setToasts((prev) => [...prev, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5200)
  }, [])

  /* ── Actions ───────────────────────────────────────────────────────────── */
  const notify = useCallback(
    (title: string, body: string, kind: AppNotification['kind'] = 'info') => {
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: { id: uid('note'), title, body, at: Date.now(), kind, read: false },
      })
      if (stateRef.current.settings.inAppNotifications) {
        pushToast({ title, body, kind })
      }
    },
    [pushToast],
  )

  const startSession = useCallback((draft: SessionDraft) => {
    const normalised = normaliseLists(draft.allowed, draft.restricted)
    const allowed =
      draft.mode === 'strict' ? withEssentialAllowed(normalised.allowed) : normalised.allowed
    const session: ActiveSession = {
      id: uid('session'),
      goal: draft.goal.trim() || 'Focus session',
      mode: draft.mode,
      plannedMinutes: draft.durationMinutes,
      startedAt: Date.now(),
      pausedMs: 0,
      pausedAt: null,
      status: 'running',
      allowed,
      restricted: normalised.restricted,
      attempts: [],
      temporaryAllows: [],
    }
    dispatch({ type: 'START_SESSION', session })
  }, [])

  const endSession = useCallback(
    (outcome: SessionOutcome): SessionRecord | null => {
      const session = stateRef.current.activeSession
      if (!session) return null
      const now = Date.now()
      const record = buildRecord(session, outcome, now)
      dispatch({ type: 'END_SESSION', record })
      if (outcome === 'completed') {
        if (stateRef.current.settings.completionChime) playCompletionChime()
        notify(
          'Session complete',
          `You focused for ${pluralize(Math.round(record.elapsedSeconds / 60), 'minute')} on "${
            record.goal
          }".`,
          'success',
        )
      } else {
        notify(
          'Session ended early',
          `You logged ${pluralize(Math.round(record.elapsedSeconds / 60), 'minute')} of focus on "${
            record.goal
          }".`,
          'warning',
        )
      }
      notify(
        'Simulated permissions restored',
        'Your normal app permissions are active again.',
        'info',
      )
      return record
    },
    [notify],
  )

  const actions = useMemo<AppActions>(
    () => ({
      startSession,
      pauseSession: () => dispatch({ type: 'PAUSE_SESSION', at: Date.now() }),
      resumeSession: () => dispatch({ type: 'RESUME_SESSION', at: Date.now() }),
      endSession,
      discardSession: () => dispatch({ type: 'DISCARD_SESSION' }),
      recordAttempt: (item: CatalogItem, temporarilyAllowed = false) =>
        dispatch({
          type: 'ADD_ATTEMPT',
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          at: Date.now(),
          temporarilyAllowed,
        }),
      setSessionPermission: (itemId: string, permission: Permission) =>
        dispatch({ type: 'SET_SESSION_PERMISSION', itemId, permission }),
      temporarilyAllow: (itemId: string, minutes: number) =>
        dispatch({
          type: 'TEMPORARY_ALLOW',
          itemId,
          until: Date.now() + minutes * 60_000,
        }),
      grantTemporaryAllow: (itemId: string, minutes: number) =>
        dispatch({
          type: 'GRANT_TEMPORARY_ALLOW',
          itemId,
          until: Date.now() + minutes * 60_000,
        }),
      revokeTemporaryAllow: (itemId: string) =>
        dispatch({ type: 'REVOKE_TEMPORARY_ALLOW', itemId }),
      updateSettings: (patch: Partial<Settings>) => dispatch({ type: 'SET_SETTINGS', payload: patch }),
      setPermission: (itemId: string, permission: Permission) =>
        dispatch({ type: 'SET_PERMISSION', itemId, permission }),
      setPermissions: (map: Record<string, Permission>) =>
        dispatch({ type: 'SET_PERMISSIONS', payload: map }),
      deleteRecord: (id: string) => dispatch({ type: 'DELETE_RECORD', id }),
      clearLastRecord: () => dispatch({ type: 'CLEAR_LAST_RECORD' }),
      loadSampleData: () => {
        dispatch({ type: 'LOAD_SAMPLE_DATA', records: createSampleSessions() })
        pushToast({
          title: 'Sample sessions loaded',
          body: 'Nine realistic sessions were added so you can explore the charts and reports.',
          kind: 'success',
        })
      },
      resetAll: () => {
        clearAllStorage()
        dispatch({ type: 'RESET_ALL' })
        pushToast({
          title: 'Demo data reset',
          body: 'Settings, history and app permissions are back to their defaults.',
          kind: 'info',
        })
      },
      notify,
      markNotificationsRead: () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }),
      clearNotifications: () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
      dismissToast: (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    }),
    [endSession, notify, pushToast, startSession],
  )

  /* ── The one and only countdown timer ──────────────────────────────────── */
  const endSessionRef = useRef(endSession)
  endSessionRef.current = endSession

  useEffect(() => {
    const session = state.activeSession
    if (!session || session.status !== 'running') return undefined

    const tick = () => {
      const current = stateRef.current.activeSession
      if (!current || current.status !== 'running') return
      if (remainingMs(current, Date.now()) <= 0) {
        endSessionRef.current('completed')
      }
    }

    const interval = window.setInterval(tick, 250)
    tick()
    return () => window.clearInterval(interval)
  }, [state.activeSession?.id, state.activeSession?.status])

  const value = useMemo<AppContextValue>(
    () => ({ state, actions, toasts, resolvedTheme }),
    [state, actions, toasts, resolvedTheme],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
