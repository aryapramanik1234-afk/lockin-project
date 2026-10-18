import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ban,
  CheckCircle2,
  CircleDot,
  Lock,
  Pause,
  Play,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Square,
  Timer,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { useNow } from '../hooks/useNow'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { AppIcon } from '../components/ui/AppIcon'
import { PermissionEditor } from '../components/apps/PermissionEditor'
import { RestrictionOverlay } from '../components/session/RestrictionOverlay'
import { AppSimulator } from '../components/session/AppSimulator'
import { APP_CATALOG, getCatalogItem } from '../data/catalog'
import {
  effectiveSessionPermission,
  isTemporarilyAllowed,
  progressRatio,
  remainingSeconds,
} from '../lib/session'
import { formatClock, formatClockTime, formatDurationLong, formatMinutes } from '../lib/format'
import type { CatalogItem, Permission } from '../types'

const RADIUS = 132
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ActiveSession() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const now = useNow()
  const session = state.activeSession

  const [editorOpen, setEditorOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [restrictedItem, setRestrictedItem] = useState<CatalogItem | null>(null)
  const [openItem, setOpenItem] = useState<CatalogItem | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<{
    itemId: string
    itemName: string
    next: Permission
  } | null>(null)
  const [pendingLists, setPendingLists] = useState<{
    allowed: string[]
    restricted: string[]
  } | null>(null)
  const [launcherQuery, setLauncherQuery] = useState('')

  // Redirect when the session ends (completed or stopped) and when there is
  // no session at all. We wait for the persisted state to be restored first,
  // otherwise a refresh during a session would kick the user out of it.
  useEffect(() => {
    if (!state.hydrated) return
    if (session) return
    const latest = state.history[0]
    const reportId =
      state.lastRecordId ??
      (latest && Date.now() - latest.endedAt < 60_000 ? latest.id : null)
    if (reportId) {
      navigate(`/report/${reportId}`, { replace: true })
    } else {
      navigate('/start', { replace: true })
    }
  }, [state.hydrated, session, state.history, state.lastRecordId, navigate])

  const remaining = session ? remainingSeconds(session, now) : 0
  const ratio = session ? progressRatio(session, now) : 0
  const isPaused = session?.status === 'paused'
  const isStrict = session?.mode === 'strict'

  const allowedItems = useMemo(
    () => (session?.allowed ?? []).map((id) => getCatalogItem(id)).filter(Boolean) as CatalogItem[],
    [session?.allowed],
  )
  const restrictedItems = useMemo(
    () =>
      (session?.restricted ?? []).map((id) => getCatalogItem(id)).filter(Boolean) as CatalogItem[],
    [session?.restricted],
  )

  const launcherItems = useMemo(() => {
    const q = launcherQuery.trim().toLowerCase()
    return APP_CATALOG.filter((item) => {
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        (item.domain ?? '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    })
  }, [launcherQuery])

  if (!state.hydrated) {
    return <LoadingScreen label="Restoring your session…" />
  }

  if (!session) {
    return (
      <div className="page">
        <EmptyState
          icon={<Timer size={22} />}
          title="No active session"
          description="Start a focus session to see the countdown timer and the restriction simulator."
          action={
            <Button variant="primary" onClick={() => navigate('/start')}>
              Start Focus Session
            </Button>
          }
        />
      </div>
    )
  }

  const openLauncherItem = (item: CatalogItem) => {
    const permission = effectiveSessionPermission(session, item.id, now)
    if (permission === 'restricted') {
      actions.recordAttempt(item)
      setRestrictedItem(item)
      return
    }
    setOpenItem(item)
  }

  const handleSessionPermissionChange = (next: {
    allowed: string[]
    restricted: string[]
  }) => {
    // Anything that was blocked before but is no longer blocked weakens the
    // session, so it needs an explicit confirmation.
    const removals = session.restricted.filter((id) => !next.restricted.includes(id))
    const removal = removals
      .map((id) => getCatalogItem(id))
      .find(Boolean) as CatalogItem | undefined
    if (removal) {
      setPendingRemoval({
        itemId: removal.id,
        itemName: removal.name,
        next: next.allowed.includes(removal.id) ? 'allowed' : 'neutral',
      })
      setPendingLists(next)
      return
    }
    applyLists(next)
  }

  const applyLists = (next: { allowed: string[]; restricted: string[] }) => {
    const all = new Set([...session.allowed, ...session.restricted, ...next.allowed, ...next.restricted])
    all.forEach((id) => {
      const permission: Permission = next.allowed.includes(id)
        ? 'allowed'
        : next.restricted.includes(id)
          ? 'restricted'
          : 'neutral'
      actions.setSessionPermission(id, permission)
    })
  }

  const attemptNumber = restrictedItem ? session.attempts.length : 0

  return (
    <div className="session-screen">
      {/* Header */}
      <header
        className="row-between"
        style={{
          padding: '16px clamp(16px, 4vw, 40px)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="row" style={{ gap: 12, minWidth: 0 }}>
          <div className="brand-mark" aria-hidden="true">
            <Lock size={17} strokeWidth={2.2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="small" style={{ fontWeight: 600 }}>
                Focus session
              </span>
              <span className={`mode-banner ${isStrict ? 'strict' : 'flexible'}`}>
                {isStrict ? <Lock size={12} /> : <SlidersHorizontal size={12} />}
                {isStrict ? 'Strict Focus' : 'Flexible Focus'}
              </span>
              {isPaused ? (
                <span className="chip chip-warning">
                  <Pause size={11} />
                  Paused
                </span>
              ) : null}
            </div>
            <div className="tiny subtle truncate">{session.goal}</div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          {isStrict ? (
            <span className="chip chip-warning" title="Strict Focus locks the restriction list">
              <Lock size={12} />
              Restrictions locked
            </span>
          ) : null}
          <Button
            variant="danger"
            size="sm"
            icon={<Square size={13} />}
            onClick={() => setEndOpen(true)}
          >
            End session
          </Button>
        </div>
      </header>

      <div
        className="page"
        style={{ paddingTop: 'var(--sp-6)', maxWidth: 1200, display: 'grid', gap: 'var(--sp-5)' }}
      >
        <div className="grid grid-auto-lg" style={{ alignItems: 'start' }}>
          {/* ── Timer column ──────────────────────────────────────────── */}
          <div className="stack stack-5">
            <div className="card card-pad-lg" style={{ textAlign: 'center' }}>
              <div className="timer-ring" style={{ margin: '0 auto' }}>
                <svg viewBox="0 0 300 300" aria-hidden="true">
                  <defs>
                    <linearGradient id="lockin-ring-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--accent-2)" />
                    </linearGradient>
                  </defs>
                  <circle
                    className="timer-ring-track"
                    cx="150"
                    cy="150"
                    r={RADIUS}
                    fill="none"
                    strokeWidth={10}
                  />
                  <circle
                    className={`timer-ring-progress${isStrict ? ' strict' : ''}`}
                    cx="150"
                    cy="150"
                    r={RADIUS}
                    fill="none"
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
                  />
                </svg>
                <div className="timer-ring-inner">
                  <div className="timer-value">{formatClock(remaining)}</div>
                  <div className="timer-label">
                    {isPaused ? 'Paused' : 'Remaining'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{session.goal}</div>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {formatMinutes(session.plannedMinutes)} planned ·{' '}
                  {Math.round(ratio * 100)}% complete
                </div>
              </div>

              <div className="bar" style={{ marginTop: 16, height: 8 }}>
                <span style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>

              <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 20 }}>
                {isPaused ? (
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<Play size={16} fill="currentColor" />}
                    onClick={actions.resumeSession}
                  >
                    Resume
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={<Pause size={16} />}
                    onClick={actions.pauseSession}
                  >
                    Pause
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="lg"
                  icon={<Square size={14} />}
                  onClick={() => setEndOpen(true)}
                >
                  Finish
                </Button>
              </div>

              <div
                className="row"
                style={{ justifyContent: 'center', gap: 18, marginTop: 18, flexWrap: 'wrap' }}
              >
                <span className="tiny subtle">
                  Started {formatClockTime(session.startedAt)}
                </span>
                <span className="tiny subtle">
                  Elapsed {formatDurationLong(
                    session.plannedMinutes * 60 - remaining,
                  )}
                </span>
                <span className="tiny subtle">
                  Attempts {session.attempts.length}
                </span>
              </div>
            </div>

            {/* Rules summary */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Session rules</div>
                  <div className="section-subtitle">
                    {isStrict
                      ? 'Locked when the session started'
                      : 'Adjustable while the session runs'}
                  </div>
                </div>
                {isStrict ? (
                  <span className="chip chip-warning">
                    <Lock size={12} />
                    Locked
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<SlidersHorizontal size={14} />}
                    onClick={() => setEditorOpen(true)}
                  >
                    Adjust
                  </Button>
                )}
              </div>
              <div className="card-body stack stack-4">
                <div>
                  <div className="tiny subtle" style={{ marginBottom: 8 }}>
                    ALLOWED ({allowedItems.length})
                  </div>
                  {allowedItems.length ? (
                    <div className="row row-wrap" style={{ gap: 6 }}>
                      {allowedItems.map((item) => (
                        <span key={item.id} className="chip chip-success">
                          {item.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="small subtle">No apps are explicitly allowed.</p>
                  )}
                </div>
                <div>
                  <div className="tiny subtle" style={{ marginBottom: 8 }}>
                    RESTRICTED ({restrictedItems.length})
                  </div>
                  {restrictedItems.length ? (
                    <div className="row row-wrap" style={{ gap: 6 }}>
                      {restrictedItems.map((item) => (
                        <span key={item.id} className="chip chip-danger">
                          {item.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="small subtle">Nothing is restricted in this session.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Side column ───────────────────────────────────────────── */}
          <div className="stack stack-5">
            {/* Simulator */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Try opening an app</div>
                  <div className="section-subtitle">
                    Sample catalog · restricted apps are intercepted
                  </div>
                </div>
                <span className="chip">
                  <CircleDot size={11} />
                  Simulator
                </span>
              </div>
              <div className="card-body stack stack-3">
                <input
                  className="input"
                  placeholder="Search the sample catalog…"
                  value={launcherQuery}
                  onChange={(event) => setLauncherQuery(event.target.value)}
                  aria-label="Search the sample app catalog"
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 8,
                    maxHeight: 320,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {launcherItems.map((item) => {
                    const permission = effectiveSessionPermission(session, item.id, now)
                    const temp = isTemporarilyAllowed(session, item.id, now)
                    const blocked = permission === 'restricted'
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="row"
                        onClick={() => openLauncherItem(item)}
                        style={{
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                          background: blocked
                            ? 'color-mix(in srgb, var(--danger) 8%, transparent)'
                            : 'var(--surface-2)',
                          textAlign: 'left',
                          minWidth: 0,
                        }}
                      >
                        <AppIcon item={item} size="sm" dimmed={blocked} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="tiny truncate" style={{ fontWeight: 550 }}>
                            {item.name}
                          </div>
                          <div
                            className="tiny"
                            style={{
                              color: blocked
                                ? 'var(--danger)'
                                : temp
                                  ? 'var(--info)'
                                  : 'var(--text-subtle)',
                            }}
                          >
                            {blocked
                              ? 'Restricted'
                              : temp
                                ? 'Temporarily allowed'
                                : item.essential
                                  ? 'Essential tool'
                                  : 'Not restricted'}
                          </div>
                        </div>
                        {blocked ? <Ban size={13} style={{ color: 'var(--danger)' }} /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Attempts */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Blocked attempts</div>
                  <div className="section-subtitle">
                    Every time a restricted app was opened
                  </div>
                </div>
                <span className="chip chip-danger">{session.attempts.length}</span>
              </div>
              <div className="card-body" style={{ paddingTop: 10 }}>
                {session.attempts.length === 0 ? (
                  <div className="callout">
                    <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
                    <span>
                      Nothing blocked yet. If you open a restricted app it will be intercepted and
                      logged here.
                    </span>
                  </div>
                ) : (
                  <div className="stack stack-2">
                    {session.attempts.map((attempt, index) => (
                      <div
                        key={`${attempt.itemId}-${attempt.at}-${index}`}
                        className="row"
                        style={{
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 'var(--r-sm)',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <ShieldAlert size={15} style={{ color: 'var(--danger)' }} />
                        <div className="grow" style={{ minWidth: 0 }}>
                          <div className="small truncate" style={{ fontWeight: 550 }}>
                            {attempt.itemName}
                          </div>
                          <div className="tiny subtle">{formatClockTime(attempt.at)}</div>
                        </div>
                        <span className="tiny subtle">#{index + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="callout callout-accent">
              <Shield size={15} />
              <span>
                <strong style={{ color: 'var(--text)' }}>Simulation only.</strong> LockIn blocks apps
                inside this page. It cannot stop you closing the browser, clearing browser data or
                opening another installed application — that needs native OS integration.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Restriction overlay */}
      {restrictedItem ? (
        <RestrictionOverlay
          item={restrictedItem}
          attemptNumber={attemptNumber}
          mode={session.mode}
          onClose={() => setRestrictedItem(null)}
        />
      ) : null}

      {/* Allowed app simulator */}
      <AppSimulator
        item={openItem}
        temporarilyAllowed={
          openItem ? isTemporarilyAllowed(session, openItem.id, now) : false
        }
        onClose={() => setOpenItem(null)}
      />

      {/* Flexible-mode permission editor */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        size="lg"
        title="Adjust restrictions"
        description="Flexible Focus lets you change what is blocked while the session runs."
        icon={<SlidersHorizontal size={19} />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditorOpen(false)
                actions.notify(
                  'Restrictions updated',
                  'Your session rules now reflect the changes you just made.',
                  'info',
                )
              }}
            >
              Done
            </Button>
          </>
        }
      >
        <PermissionEditor
          compact
          allowed={session.allowed}
          restricted={session.restricted}
          onChange={handleSessionPermissionChange}
          mode="flexible"
          temporaryAllows={session.temporaryAllows}
          onTemporaryAllow={(itemId, minutes) => {
            actions.temporarilyAllow(itemId, minutes)
            const item = getCatalogItem(itemId)
            actions.notify(
              'Temporarily allowed',
              `${item?.name ?? 'The app'} is allowed for ${minutes} minutes.`,
              'info',
            )
          }}
        />
      </Modal>

      {/* Warning before a restriction is removed */}
      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        tone="warning"
        icon={<ShieldAlert size={19} />}
        title="Remove this restriction?"
        description="You are weakening the rules you set for this session."
        confirmLabel="Remove restriction"
        cancelLabel="Keep it blocked"
        onCancel={() => {
          setPendingRemoval(null)
          setPendingLists(null)
        }}
        onConfirm={() => {
          if (pendingLists) applyLists(pendingLists)
          setPendingRemoval(null)
          setPendingLists(null)
        }}
        body={
          <p>
            <strong style={{ color: 'var(--text)' }}>{pendingRemoval?.itemName}</strong> will be
            reachable for the rest of this session. Strict Focus sessions never allow this — use
            Flexible Focus if you need the change.
          </p>
        }
      />

      {/* End session confirmation */}
      <ConfirmDialog
        open={endOpen}
        tone="danger"
        icon={<Square size={18} />}
        title="End this session early?"
        description="The report will record it as an early finish."
        confirmLabel="End session"
        cancelLabel="Keep focusing"
        onCancel={() => setEndOpen(false)}
        onConfirm={() => {
          setEndOpen(false)
          actions.endSession('ended-early')
        }}
        body={
          <p>
            You have focused for{' '}
            <strong style={{ color: 'var(--text)' }}>
              {formatDurationLong(session.plannedMinutes * 60 - remaining)}
            </strong>{' '}
            of {formatMinutes(session.plannedMinutes)}. The session will be saved to your history as
            an early finish.
          </p>
        }
      />
    </div>
  )
}
