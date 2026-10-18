import { useMemo, useState } from 'react'
import {
  Ban,
  Check,
  Clock,
  Info,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Timer,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { PermissionEditor } from '../components/apps/PermissionEditor'
import { getCatalogItem } from '../data/catalog'
import { defaultPermissionMap } from '../lib/session'
import { formatRelative } from '../lib/format'
import type { Permission } from '../types'

const TEMP_OPTIONS = [10, 15, 30, 60]

export function AppManagement() {
  const { state, actions } = useApp()
  const [tempChoice, setTempChoice] = useState(15)

  const allowed = useMemo(
    () => Object.entries(state.permissions).filter(([, p]) => p === 'allowed').map(([id]) => id),
    [state.permissions],
  )
  const restricted = useMemo(
    () =>
      Object.entries(state.permissions)
        .filter(([, p]) => p === 'restricted')
        .map(([id]) => id),
    [state.permissions],
  )
  const neutral = Object.keys(state.permissions).length - allowed.length - restricted.length

  const activeTemporaries = state.temporaryAllows.filter((t) => t.until > Date.now())

  if (!state.hydrated) return <LoadingScreen label="Loading the app catalog…" />

  const applyLists = (next: { allowed: string[]; restricted: string[] }) => {
    const map: Record<string, Permission> = { ...state.permissions }
    const touched = new Set([...next.allowed, ...next.restricted, ...allowed, ...restricted])
    touched.forEach((id) => {
      if (next.allowed.includes(id)) map[id] = 'allowed'
      else if (next.restricted.includes(id)) map[id] = 'restricted'
      else delete map[id]
    })
    actions.setPermissions(map)
  }

  const resetToDefaults = () => {
    actions.setPermissions(defaultPermissionMap())
    actions.notify(
      'Permissions reset',
      'The app catalog is back to the LockIn sample configuration.',
      'info',
    )
  }

  const saveAsDefaults = () => {
    actions.updateSettings({ defaultAllowed: allowed, defaultRestricted: restricted })
    actions.notify(
      'Session defaults updated',
      `New sessions start with ${allowed.length} allowed and ${restricted.length} restricted apps.`,
      'success',
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <Shield size={13} />
            App management
          </div>
          <h1 className="page-title">Apps &amp; websites</h1>
          <p className="page-subtitle">
            Decide what stays reachable and what gets blocked. These permissions are your normal
            configuration and are used to seed every new session.
          </p>
        </div>
        <div className="row row-wrap" style={{ gap: 8 }}>
          <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={resetToDefaults}>
            Reset to sample defaults
          </Button>
          <Button variant="primary" icon={<Save size={15} />} onClick={saveAsDefaults}>
            Use as session defaults
          </Button>
        </div>
      </div>

      <div className="callout callout-accent" style={{ marginBottom: 'var(--sp-5)' }}>
        <Info size={15} />
        <span>
          <strong style={{ color: 'var(--text)' }}>Sample catalog.</strong> These entries are
          illustrative data bundled with LockIn. The app does not scan, detect or control the
          software installed on your device — real blocking needs native operating-system access.
        </span>
      </div>

      <section className="grid grid-3" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card stat">
          <div className="stat-label">
            <Check size={14} style={{ color: 'var(--success)' }} />
            Allowed
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {allowed.length}
          </div>
          <div className="stat-foot">Stay reachable during a session</div>
        </div>
        <div className="card stat">
          <div className="stat-label">
            <Ban size={14} style={{ color: 'var(--danger)' }} />
            Restricted
          </div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {restricted.length}
          </div>
          <div className="stat-foot">Blocked by the simulator</div>
        </div>
        <div className="card stat">
          <div className="stat-label">
            <Sparkles size={14} />
            No rule
          </div>
          <div className="stat-value">{neutral}</div>
          <div className="stat-foot">Untouched — not blocked, not guaranteed</div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Permission rules</div>
            <div className="section-subtitle">
              Search, filter by category and set the rule for each entry
            </div>
          </div>
        </div>
        <div className="card-body">
          <PermissionEditor
            allowed={allowed}
            restricted={restricted}
            onChange={applyLists}
            mode="flexible"
            temporaryAllows={state.temporaryAllows}
            temporaryAllowMinutes={tempChoice}
            onTemporaryAllow={(itemId, minutes) => {
              actions.grantTemporaryAllow(itemId, minutes)
              const item = getCatalogItem(itemId)
              actions.notify(
                'Temporary allowance granted',
                `${item?.name ?? 'The app'} will be allowed for ${minutes} minutes in your next Flexible session.`,
                'info',
              )
            }}
          />
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Temporary allowances</div>
            <div className="section-subtitle">
              For legitimate academic use — a restricted app allowed for a short window
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {TEMP_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`chip${tempChoice === minutes ? ' chip-accent' : ''}`}
                onClick={() => setTempChoice(minutes)}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          {activeTemporaries.length === 0 ? (
            <div className="callout">
              <Clock size={15} />
              <span>
                No active allowances. Use the <strong style={{ color: 'var(--text)' }}>+15m</strong>{' '}
                button next to a restricted app to allow it for a short window — for example, a
                video lecture your course requires.
              </span>
            </div>
          ) : (
            <div className="stack stack-2">
              {activeTemporaries.map((temporary) => {
                const item = getCatalogItem(temporary.itemId)
                const minutesLeft = Math.max(
                  0,
                  Math.ceil((temporary.until - Date.now()) / 60000),
                )
                return (
                  <div
                    key={temporary.itemId}
                    className="row"
                    style={{
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--info-soft)',
                      border: '1px solid transparent',
                    }}
                  >
                    <Timer size={15} style={{ color: 'var(--info)' }} />
                    <div className="grow">
                      <div className="small" style={{ fontWeight: 550 }}>
                        {item?.name ?? temporary.itemId}
                      </div>
                      <div className="tiny subtle">
                        Allowed for {minutesLeft} more minute{minutesLeft === 1 ? '' : 's'} · granted{' '}
                        {formatRelative(temporary.until - tempChoice * 60_000)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => actions.revokeTemporaryAllow(temporary.itemId)}
                    >
                      Revoke
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
