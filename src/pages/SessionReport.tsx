import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  History,
  Play,
  Shield,
  ShieldAlert,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { AppIcon } from '../components/ui/AppIcon'
import { getCatalogItem } from '../data/catalog'
import { estimateFocusIndex } from '../lib/session'
import {
  formatClockTime,
  formatDurationLong,
  formatFullDate,
  formatMinutes,
} from '../lib/format'

const ENCOURAGEMENT = [
  'Every focused minute compounds. Keep the streak alive.',
  'That is a real block of uninterrupted attention — well done.',
  'Consistency beats intensity. You showed up and stayed.',
  'Small sessions, repeated often, beat one long session.',
  'You protected this time for yourself. That counts.',
]

export function SessionReport() {
  const { state, actions } = useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const record = state.history.find((item) => item.id === id)

  // The report has been opened, so the "just finished" flag can be cleared.
  useEffect(() => {
    actions.clearLastRecord()
  }, [actions])

  if (!record) {
    return (
      <div className="page page-narrow">
        <EmptyState
          icon={<History size={22} />}
          title="Report not found"
          description="This session report is not in your history any more — it may have been deleted."
          action={
            <Button variant="primary" onClick={() => navigate('/history')}>
              Back to history
            </Button>
          }
        />
      </div>
    )
  }

  const completed = record.outcome === 'completed'
  const estimate = estimateFocusIndex(record)
  const message = ENCOURAGEMENT[record.goal.length % ENCOURAGEMENT.length] ?? ENCOURAGEMENT[0]
  const completionRatio = Math.min(
    100,
    Math.round((record.elapsedSeconds / (record.plannedMinutes * 60)) * 100),
  )

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <Sparkles size={13} />
            Session report
          </div>
          <h1 className="page-title">{record.goal}</h1>
          <p className="page-subtitle">
            {formatFullDate(record.startedAt)} · {formatClockTime(record.startedAt)}–
            {formatClockTime(record.endedAt)}
          </p>
        </div>
        <span className={`chip ${completed ? 'chip-success' : 'chip-warning'}`}>
          {completed ? <CheckCircle2 size={13} /> : <Flag size={13} />}
          {completed ? 'Completed' : 'Ended early'}
        </span>
      </div>

      <section
        className="card card-pad-lg anim-in"
        style={{
          marginBottom: 'var(--sp-5)',
          background:
            'radial-gradient(90% 140% at 0% 0%, var(--accent-softer), transparent 55%), var(--surface)',
        }}
      >
        <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
          <div
            className="icon-tile icon-tile-lg"
            style={{
              color: completed ? 'var(--success)' : 'var(--warning)',
              background: completed ? 'var(--success-soft)' : 'var(--warning-soft)',
              borderColor: 'transparent',
            }}
          >
            {completed ? <CheckCircle2 size={22} /> : <Flag size={22} />}
          </div>
          <div>
            <h2 className="section-title" style={{ fontSize: 19 }}>
              {completed ? 'Session complete' : 'You stopped early'}
            </h2>
            <p className="small muted" style={{ marginTop: 4, maxWidth: '48ch' }}>
              {message}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-3" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card stat">
          <div className="stat-label">
            <Timer size={14} />
            Actual focus time
          </div>
          <div className="stat-value">
            {formatDurationLong(record.elapsedSeconds)}
          </div>
          <div className="stat-foot">Planned {formatMinutes(record.plannedMinutes)}</div>
        </div>

        <div className="card stat">
          <div className="stat-label">
            <Shield size={14} />
            Focus mode
          </div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {record.mode === 'strict' ? 'Strict' : 'Flexible'}
          </div>
          <div className="stat-foot">
            {record.mode === 'strict' ? 'Restrictions were locked' : 'Restrictions were adjustable'}
          </div>
        </div>

        <div className="card stat">
          <div className="stat-label">
            <ShieldAlert size={14} />
            Blocked attempts
          </div>
          <div className="stat-value">{record.restrictedAttempts}</div>
          <div className="stat-foot">Simulated restriction hits</div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Session progress</div>
            <div className="section-subtitle">
              {completed
                ? 'You reached the end of the planned block.'
                : 'You ended the session before the planned finish.'}
            </div>
          </div>
          <span className="chip">{completionRatio}% of plan</span>
        </div>
        <div className="card-body stack stack-4">
          <div className="bar" style={{ height: 10 }}>
            <span style={{ width: `${completionRatio}%` }} />
          </div>
          <div className="row-between small muted">
            <span>
              {formatDurationLong(record.elapsedSeconds)} focused
            </span>
            <span>{formatMinutes(record.plannedMinutes)} planned</span>
          </div>

          <div className="divider" style={{ margin: '4px 0' }} />

          <div className="grid grid-2">
            <div>
              <div className="tiny subtle" style={{ marginBottom: 8 }}>
                ALLOWED ({record.allowedCount})
              </div>
              <div className="row row-wrap" style={{ gap: 6 }}>
                {record.allowedCount ? (
                  <span className="chip chip-success">{record.allowedCount} items stayed open</span>
                ) : (
                  <span className="small subtle">Nothing explicitly allowed</span>
                )}
              </div>
            </div>
            <div>
              <div className="tiny subtle" style={{ marginBottom: 8 }}>
                RESTRICTED ({record.restrictedCount})
              </div>
              <div className="row row-wrap" style={{ gap: 6 }}>
                {record.restrictedCount ? (
                  <span className="chip chip-danger">
                    {record.restrictedCount} items were blocked
                  </span>
                ) : (
                  <span className="small subtle">Nothing was restricted</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Blocked attempts</div>
            <div className="section-subtitle">
              Simulated attempts to open a restricted app or website
            </div>
          </div>
          <span className="chip chip-danger">{record.restrictedAttempts}</span>
        </div>
        <div className="card-body" style={{ paddingTop: 10 }}>
          {record.attempts.length === 0 ? (
            <div className="callout">
              <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
              <span>You never tried to open a restricted app in this session.</span>
            </div>
          ) : (
            <div className="stack stack-2">
              {record.attempts.map((attempt, index) => {
                const item = getCatalogItem(attempt.itemId)
                return (
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
                    {item ? <AppIcon item={item} size="sm" /> : null}
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small truncate" style={{ fontWeight: 550 }}>
                        {attempt.itemName}
                      </div>
                      <div className="tiny subtle">
                        {formatClockTime(attempt.at)} · attempt #{index + 1}
                      </div>
                    </div>
                    <span className="chip chip-danger">Blocked</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="card card-pad" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <div
            className="icon-tile"
            style={{ color: 'var(--accent-text)', background: 'var(--accent-soft)', borderColor: 'transparent' }}
          >
            <TrendingUp size={18} />
          </div>
          <div className="grow">
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <span className="card-title">Estimated focus index</span>
              <span className="chip chip-warning">Estimate — not a measurement</span>
            </div>
            <div className="row" style={{ gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="stat-value" style={{ fontSize: 26 }}>
                {estimate}
                <small>/100</small>
              </span>
              <span className="small muted" style={{ maxWidth: '46ch' }}>
                Calculated only from the number of blocked distraction attempts in this simulation
                and whether the session ran to the end. LockIn does not and cannot measure your
                actual concentration.
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="row row-wrap" style={{ gap: 10 }}>
        <Button
          variant="primary"
          icon={<Play size={15} fill="currentColor" />}
          onClick={() => navigate('/start')}
        >
          Start another session
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
        <Link to="/history" className="btn btn-ghost">
          <History size={15} />
          All sessions
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
