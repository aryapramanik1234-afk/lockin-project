/**
 * Namespaced, versioned and defensive localStorage helpers.
 *
 * Every read is guarded: a corrupt or partial payload can never crash the app,
 * it simply falls back to the provided default.
 */

const PREFIX = 'lockin:v1:'

export const STORAGE_KEYS = {
  settings: `${PREFIX}settings`,
  history: `${PREFIX}history`,
  permissions: `${PREFIX}permissions`,
  activeSession: `${PREFIX}active-session`,
  notifications: `${PREFIX}notifications`,
  temporaryAllows: `${PREFIX}temporary-allows`,
  onboarding: `${PREFIX}onboarding`,
} as const

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    if (parsed === null || parsed === undefined) return fallback
    return parsed
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota exceeded or private mode — the app keeps working in memory */
  }
}

export function removeStorage(key: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(removeStorage)
}
