import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Flag,
  History,
  Play,
  Search,
  Shield,
  Timer,
  Trash2,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Segmented } from '../components/ui/Segmented'
import { computeTotals } from '../lib/session'
import { formatDate, formatDurationLong, formatMinutes } from '../lib/format'

type OutcomeFilter = 'all' | 'completed' | 'early'
type ModeFilter = 'all' | 'flexible' | 'strict'

export function SessionHistory() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [outcome, setOutcome] = useState<OutcomeFilter>('all')
  const [mode, setMode] = useState<ModeFilter>('all')
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const records = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.history.filter((record) => {
      if (outcome === 'completed' && record.outcome !== 'completed') return false
      if (outcome === 'early' && record.outcome !== 'ended-early') return false
      if (mode !== 'all' && record.mode !== mode) return false
      if (!q) return true
      return record.goal.toLowerCase().includes(q)
    })
  }, [state.history, outcome, mode, query])

  const totals = computeTotals(state.history)

  if (!state.hydrated) return <LoadingScreen label="Loading your sessions…" />

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <History size={13} />
            Session history
          </div>
          <h1 className="page-title">Everything you have logged</h1>
          <p className="page-subtitle">
            Each entry is a real session recorded on this device — no placeholders, no sample
            numbers.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Play size={15} fill="currentColor" />}
          onClick={() => navigate('/start')}
        >
          New session
        </Button>
      </div>

      {state.history.length > 0 ? (
        <section className="grid grid-3" style={{ marginBottom: 'var(--sp-5)' }}>
          <div className="card stat">
            <div className="stat-label">
              <Timer size={14} />
              Total focus time
            </div>
            <div className="stat-value">
              {formatDurationLong(totals.totalMinutes * 60)}
            </div>
            <div className="stat-foot">Across {totals.totalSessions} sessions</div>
          </div>
          <div className="card stat">
            <div className="stat-label">
              <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
              Completed
            </div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {totals.completedSessions}
            </div>
            <div className="stat-foot">{totals.earlySessions} ended early</div>
          </div>
          <div className="card stat">
            <div className="stat-label">
              <Ban size={14} style={{ color: 'var(--danger)' }} />
              Blocked attempts
            </div>
            <div className="stat-value">{totals.restrictedAttempts}</div>
            <div className="stat-foot">Simulated distraction hits</div>
          </div>
        </section>
      ) : null}

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              {state.history.length ? 'Sessions' : 'No sessions yet'}
            </div>
            <div className="section-subtitle">
              {records.length} of {state.history.length} shown
            </div>
          </div>
          <div className="row row-wrap" style={{ gap: 8 }}>
            <div className="input-icon" style={{ width: 200 }}>
              <Search size={15} />
              <input
                className="input"
                placeholder="Search goals…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search sessions by goal"
              />
            </div>
            <Segmented
              options={[
                { value: 'all', label: 'All' },
                { value: 'completed', label: 'Completed' },
                { value: 'early', label: 'Early' },
              ]}
              value={outcome}
              onChange={setOutcome}
              ariaLabel="Filter by outcome"
            />
            <Segmented
              options={[
                { value: 'all', label: 'Any mode' },
                { value: 'flexible', label: 'Flexible' },
                { value: 'strict', label: 'Strict' },
              ]}
              value={mode}
              onChange={setMode}
              ariaLabel="Filter by focus mode"
            />
          </div>
        </div>

        <div className="card-body" style={{ paddingTop: 10 }}>
          {records.length === 0 ? (
            <EmptyState
              icon={<History size={22} />}
              title={state.history.length ? 'No sessions match your filters' : 'No sessions completed yet'}
              description={
                state.history.length
                  ? 'Try clearing the search box or switching the filters.'
                  : 'Finish a focus session and it will be recorded here with its goal, mode, duration and blocked attempts.'
              }
              action={
                state.history.length ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery('')
                      setOutcome('all')
                      setMode('all')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => navigate('/start')}>
                    Start your first session
                  </Button>
                )
              }
            />
          ) : (
            <div className="stack stack-2">
              {records.map((record) => {
                const completion = Math.min(
                  100,
                  Math.round((record.elapsedSeconds / (record.plannedMinutes * 60)) * 100),
                )
                return (
                  <div
                    key={record.id}
                    className="list-row"
                    style={{
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                    }}
                  >
                    <div
                      className="icon-tile"
                      style={{
                        color: record.mode === 'strict' ? 'var(--warning)' : 'var(--info)',
                        background:
                          record.mode === 'strict' ? 'var(--warning-soft)' : 'var(--info-soft)',
                        borderColor: 'transparent',
                      }}
                    >
                      {record.mode === 'strict' ? <Shield size={17} /> : <Timer size={17} />}
                    </div>

                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="small truncate" style={{ fontWeight: 600 }}>
                          {record.goal}
                        </span>
                        <span
                          className={`chip ${record.outcome === 'completed' ? 'chip-success' : 'chip-warning'}`}
                          style={{ height: 20, fontSize: 10.5 }}
                        >
                          {record.outcome === 'completed' ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <Flag size={11} />
                          )}
                          {record.outcome === 'completed' ? 'Completed' : 'Early'}
                        </span>
                      </div>
                      <div className="tiny subtle row" style={{ gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                        <span className="row" style={{ gap: 4 }}>
                          <Clock size={11} />
                          {formatDate(record.startedAt)}
                        </span>
                        <span className="row" style={{ gap: 4 }}>
                          <Timer size={11} />
                          {formatDurationLong(record.elapsedSeconds)} of{' '}
                          {formatMinutes(record.plannedMinutes)}
                        </span>
                        <span className="row" style={{ gap: 4 }}>
                          <Ban size={11} />
                          {record.restrictedAttempts} blocked
                        </span>
                      </div>
                      <div className="bar" style={{ marginTop: 8, height: 5 }}>
                        <span style={{ width: `${completion}%` }} />
                      </div>
                    </div>

                    <div className="row" style={{ gap: 6 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete session ${record.goal}`}
                        onClick={() => setPendingDelete(record.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                      <Link to={`/report/${record.id}`} className="btn btn-secondary btn-sm">
                        Report
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        tone="danger"
        icon={<Trash2 size={18} />}
        title="Delete this session?"
        description="The record is removed from your history and the weekly chart."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) actions.deleteRecord(pendingDelete)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
