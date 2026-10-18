import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Flame,
  History,
  ListChecks,
  Play,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Timer,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { WeeklyFocusChart } from '../components/charts/WeeklyFocusChart'
import {
  computeStreak,
  focusMinutesOnDay,
  sessionCountOnDay,
  weeklyBuckets,
} from '../lib/session'
import { formatDurationLong, formatRelative, pluralize } from '../lib/format'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { state } = useApp()
  const navigate = useNavigate()
  const history = state.history
  const now = Date.now()

  if (!state.hydrated) return <LoadingScreen label="Loading your dashboard…" />

  const todayMinutes = focusMinutesOnDay(history, now)
  const todaySessions = sessionCountOnDay(history, now)
  const completed = history.filter((h) => h.outcome === 'completed')
  const streak = computeStreak(history, now)
  const week = weeklyBuckets(history, now, 7)
  const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0)
  const recent = history.slice(0, 5)
  const session = state.activeSession

  return (
    <div className="page">
      {/* Hero */}
      <section
        className="card anim-in"
        style={{
          padding: 'clamp(22px, 4vw, 34px)',
          marginBottom: 'var(--sp-6)',
          background:
            'radial-gradient(90% 140% at 100% 0%, var(--accent-softer), transparent 60%), var(--surface)',
          borderColor: 'var(--border-strong)',
          overflow: 'hidden',
        }}
      >
        <div className="row-between row-wrap" style={{ gap: 'var(--sp-6)' }}>
          <div style={{ maxWidth: 560 }}>
            <div className="page-eyebrow">
              <Sparkles size={13} />
              {greeting()}, student
            </div>
            <h1 className="page-title" style={{ fontSize: 'clamp(26px, 4.2vw, 38px)' }}>
              Lock distractions.
              <br />
              <span style={{ color: 'var(--accent-text)' }}>Unlock your potential.</span>
            </h1>
            <p className="page-subtitle">
              Choose a goal, pick a focus mode and decide which apps stay out of reach while you
              study. Everything you log is stored on this device.
            </p>
            <div className="row row-wrap" style={{ marginTop: 'var(--sp-5)' }}>
              {session ? (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Play size={16} fill="currentColor" />}
                  onClick={() => navigate('/session')}
                >
                  Resume session
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Play size={16} fill="currentColor" />}
                  onClick={() => navigate('/start')}
                >
                  Start Focus Session
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={() => navigate('/apps')}>
                Manage apps
              </Button>
            </div>
          </div>

          <div className="stack stack-3" style={{ minWidth: 240, flex: '1 1 260px' }}>
            <div className="card card-pad-sm" style={{ background: 'var(--surface-inset)' }}>
              <div className="stat-label" style={{ marginBottom: 6 }}>
                <Timer size={14} />
                Today
              </div>
              <div className="row-between">
                <div className="stat-value" style={{ fontSize: 28 }}>
                  {Math.round(todayMinutes)}
                  <small>min</small>
                </div>
                <span className="chip">{pluralize(todaySessions, 'session')}</span>
              </div>
            </div>
            <div className="card card-pad-sm" style={{ background: 'var(--surface-inset)' }}>
              <div className="stat-label" style={{ marginBottom: 6 }}>
                <Flame size={14} style={{ color: 'var(--warning)' }} />
                Current streak
              </div>
              <div className="row-between">
                <div className="stat-value" style={{ fontSize: 28 }}>
                  {streak}
                  <small>{streak === 1 ? 'day' : 'days'}</small>
                </div>
                <span className="chip chip-warning">
                  {streak > 0 ? 'Keep it alive' : 'Start today'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-4" style={{ marginBottom: 'var(--sp-6)' }}>
        <StatCard
          label="Today's focus time"
          value={Math.round(todayMinutes)}
          unit="min"
          icon={<Timer size={14} />}
          tone="accent"
          delay={0}
          foot={
            history.length
              ? `${pluralize(todaySessions, 'session')} logged today`
              : 'No sessions logged yet'
          }
        />
        <StatCard
          label="Completed sessions"
          value={completed.length}
          icon={<CheckCircle2 size={14} />}
          tone="success"
          delay={60}
          foot={
            history.length - completed.length > 0
              ? `${history.length - completed.length} ended early`
              : 'Every session ran to the end'
          }
        />
        <StatCard
          label="Current study streak"
          value={streak}
          unit={streak === 1 ? 'day' : 'days'}
          icon={<Flame size={14} />}
          tone="warning"
          delay={120}
          foot={streak > 0 ? 'Consecutive days with a finished session' : 'Finish a session to start one'}
        />
        <StatCard
          label="Focus this week"
          value={Math.round(weekMinutes / 60 * 10) / 10}
          unit="hrs"
          icon={<CalendarDays size={14} />}
          delay={180}
          foot={`${week.filter((d) => d.sessions > 0).length} of 7 days active`}
        />
      </section>

      <section className="grid grid-auto-lg" style={{ marginBottom: 'var(--sp-6)' }}>
        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly focus chart</div>
              <div className="section-subtitle">Minutes focused per day, last 7 days</div>
            </div>
            <Link to="/progress" className="btn btn-ghost btn-sm">
              Details
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body">
            {history.length === 0 ? (
              <EmptyState
                compact
                icon={<ListChecks size={22} />}
                title="No focus data yet"
                description="Finish your first session and this chart will fill with real, recorded focus time."
                action={
                  <Button variant="primary" size="sm" onClick={() => navigate('/start')}>
                    Start a session
                  </Button>
                }
              />
            ) : (
              <WeeklyFocusChart data={week} />
            )}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent sessions</div>
              <div className="section-subtitle">Your last few focus blocks</div>
            </div>
            <Link to="/history" className="btn btn-ghost btn-sm">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            {recent.length === 0 ? (
              <EmptyState
                compact
                icon={<History size={22} />}
                title="No sessions completed yet"
                description="Once you finish a focus session it will show up here with its goal, mode and duration."
                action={
                  <Button variant="primary" size="sm" onClick={() => navigate('/start')}>
                    Start your first session
                  </Button>
                }
              />
            ) : (
              <div className="stack stack-2">
                {recent.map((record) => (
                  <Link
                    key={record.id}
                    to={`/report/${record.id}`}
                    className="list-row"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      className="icon-tile"
                      style={{
                        width: 34,
                        height: 34,
                        color: record.mode === 'strict' ? 'var(--warning)' : 'var(--info)',
                        background:
                          record.mode === 'strict'
                            ? 'var(--warning-soft)'
                            : 'var(--info-soft)',
                        borderColor: 'transparent',
                      }}
                    >
                      {record.mode === 'strict' ? <Shield size={16} /> : <Timer size={16} />}
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small truncate" style={{ fontWeight: 550 }}>
                        {record.goal}
                      </div>
                      <div className="tiny subtle">
                        {formatRelative(record.endedAt)} · {record.mode === 'strict' ? 'Strict' : 'Flexible'}
                      </div>
                    </div>
                    <div className="tiny nums subtle nowrap">
                      {formatDurationLong(record.elapsedSeconds)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick access */}
      <section className="grid grid-3">
        <Link to="/apps" className="card card-pad card-hover anim-in" style={{ '--d': '0ms' } as React.CSSProperties}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="icon-tile" style={{ color: 'var(--accent-text)' }}>
              <Shield size={18} />
            </div>
            <div>
              <div className="card-title">App management</div>
              <div className="tiny subtle">Sample catalog</div>
            </div>
          </div>
          <p className="small muted">
            Choose which apps and sites are allowed, restricted or untouched during a session.
          </p>
        </Link>

        <Link to="/history" className="card card-pad card-hover anim-in" style={{ '--d': '60ms' } as React.CSSProperties}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="icon-tile" style={{ color: 'var(--info)' }}>
              <History size={18} />
            </div>
            <div>
              <div className="card-title">Session history</div>
              <div className="tiny subtle">
                {history.length ? pluralize(history.length, 'record') : 'Nothing logged yet'}
              </div>
            </div>
          </div>
          <p className="small muted">
            Review every session you have logged, including goals, durations and blocked attempts.
          </p>
        </Link>

        <Link to="/settings" className="card card-pad card-hover anim-in" style={{ '--d': '120ms' } as React.CSSProperties}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="icon-tile" style={{ color: 'var(--success)' }}>
              <SettingsIcon size={18} />
            </div>
            <div>
              <div className="card-title">Settings</div>
              <div className="tiny subtle">Preferences & defaults</div>
            </div>
          </div>
          <p className="small muted">
            Theme, default duration and focus mode, default app permissions and demo data reset.
          </p>
        </Link>
      </section>

      {state.settings.showSimulatedBanner ? (
        <div className="callout callout-accent" style={{ marginTop: 'var(--sp-6)' }}>
          <Shield size={16} />
          <span>
            <strong style={{ color: 'var(--text)' }}>Honest scope:</strong> LockIn simulates app
            blocking inside this web page. It cannot stop you closing the tab, clearing browser data
            or opening another installed app — that needs native operating-system integration.
          </span>
        </div>
      ) : null}
    </div>
  )
}
