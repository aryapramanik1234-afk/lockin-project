import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CalendarCheck,
  ChartColumn,
  Clock,
  Flame,
  ListChecks,
  Play,
  Shield,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { WeeklyFocusChart } from '../components/charts/WeeklyFocusChart'
import { computeStreak, computeTotals, weeklyBuckets } from '../lib/session'
import { formatMinutes, pluralize } from '../lib/format'

export function Progress() {
  const { state } = useApp()
  const navigate = useNavigate()
  const history = state.history
  const now = Date.now()

  const totals = computeTotals(history)
  const streak = computeStreak(history, now)
  const week = weeklyBuckets(history, now, 7)
  const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0)
  const activeDays = week.filter((day) => day.sessions > 0).length

  const goalBreakdown = useMemo(() => {
    const map = new Map<string, { minutes: number; sessions: number }>()
    history.forEach((record) => {
      const key = record.goal.trim() || 'Untitled session'
      const entry = map.get(key) ?? { minutes: 0, sessions: 0 }
      entry.minutes += record.elapsedSeconds / 60
      entry.sessions += 1
      map.set(key, entry)
    })
    return Array.from(map.entries())
      .map(([goal, data]) => ({ goal, ...data }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6)
  }, [history])

  const modeBreakdown = useMemo(() => {
    const flexible = history.filter((r) => r.mode === 'flexible')
    const strict = history.filter((r) => r.mode === 'strict')
    const summarise = (records: typeof history) => ({
      sessions: records.length,
      minutes: records.reduce((sum, r) => sum + r.elapsedSeconds / 60, 0),
      blocked: records.reduce((sum, r) => sum + r.restrictedAttempts, 0),
      average: records.length
        ? records.reduce((sum, r) => sum + r.elapsedSeconds, 0) / records.length / 60
        : 0,
    })
    return { flexible: summarise(flexible), strict: summarise(strict) }
  }, [history])

  const lastFourWeeks = useMemo(() => {
    const weeks: { label: string; minutes: number; sessions: number }[] = []
    for (let index = 3; index >= 0; index -= 1) {
      const end = now - index * 7 * 86_400_000
      const start = end - 7 * 86_400_000
      const records = history.filter((r) => r.startedAt >= start && r.startedAt <= end)
      weeks.push({
        label: index === 0 ? 'This week' : `${index} week${index > 1 ? 's' : ''} ago`,
        minutes: records.reduce((sum, r) => sum + r.elapsedSeconds / 60, 0),
        sessions: records.length,
      })
    }
    return weeks
  }, [history, now])

  if (!state.hydrated) return <LoadingScreen label="Loading your progress…" />

  if (history.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              <ChartColumn size={13} />
              Progress
            </div>
            <h1 className="page-title">Your focus, measured</h1>
            <p className="page-subtitle">
              Every number on this page comes from sessions you actually completed on this device.
            </p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            icon={<BarChart3 size={22} />}
            title="No progress to show yet"
            description="Complete a focus session and LockIn will chart your real focus time, streaks and consistency here."
            action={
              <Button variant="primary" onClick={() => navigate('/start')}>
                Start a focus session
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const maxWeek = Math.max(...lastFourWeeks.map((w) => w.minutes), 1)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <ChartColumn size={13} />
            Progress
          </div>
          <h1 className="page-title">Your focus, measured</h1>
          <p className="page-subtitle">
            Every number on this page comes from sessions you actually completed on this device.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Play size={15} fill="currentColor" />}
          onClick={() => navigate('/start')}
        >
          Focus now
        </Button>
      </div>

      <section className="grid grid-4" style={{ marginBottom: 'var(--sp-5)' }}>
        <StatCard
          label="Total focus time"
          value={Math.round(totals.totalMinutes)}
          unit="min"
          icon={<Timer size={14} />}
          tone="accent"
          foot={pluralize(totals.totalSessions, 'session')}
        />
        <StatCard
          label="Average session"
          value={Math.round(totals.averageMinutes)}
          unit="min"
          icon={<Clock size={14} />}
          delay={60}
          foot={`Longest ${formatMinutes(totals.longestMinutes)}`}
        />
        <StatCard
          label="Current streak"
          value={streak}
          unit={streak === 1 ? 'day' : 'days'}
          icon={<Flame size={14} />}
          tone="warning"
          delay={120}
          foot={`${totals.completedSessions} completed sessions`}
        />
        <StatCard
          label="Consistency"
          value={activeDays}
          unit="/7 days"
          icon={<CalendarCheck size={14} />}
          delay={180}
          foot="Days with at least one session"
        />
      </section>

      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Weekly focus chart</div>
            <div className="section-subtitle">
              {formatMinutes(weekMinutes)} focused across the last 7 days
            </div>
          </div>
          <span className="chip">
            <TrendingUp size={12} />
            Live data
          </span>
        </div>
        <div className="card-body">
          <WeeklyFocusChart data={week} />
        </div>
      </section>

      <section className="grid grid-2" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Last four weeks</div>
              <div className="section-subtitle">Focus minutes per week</div>
            </div>
          </div>
          <div className="card-body stack stack-4">
            {lastFourWeeks.map((weekData) => (
              <div key={weekData.label} className="stack stack-2">
                <div className="row-between small">
                  <span style={{ fontWeight: 550 }}>{weekData.label}</span>
                  <span className="tiny subtle nums">
                    {Math.round(weekData.minutes)}m · {pluralize(weekData.sessions, 'session')}
                  </span>
                </div>
                <div className="bar" style={{ height: 8 }}>
                  <span style={{ width: `${Math.round((weekData.minutes / maxWeek) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Focus by study goal</div>
              <div className="section-subtitle">Where your time actually went</div>
            </div>
            <Target size={16} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <div className="card-body stack stack-3">
            {goalBreakdown.length === 0 ? (
              <p className="small subtle">No goals recorded yet.</p>
            ) : (
              goalBreakdown.map((entry) => (
                <div key={entry.goal} className="stack stack-2">
                  <div className="row-between">
                    <span className="small truncate" style={{ fontWeight: 550, maxWidth: '60%' }}>
                      {entry.goal}
                    </span>
                    <span className="tiny subtle nums">
                      {Math.round(entry.minutes)}m · {pluralize(entry.sessions, 'session')}
                    </span>
                  </div>
                  <div className="bar" style={{ height: 6 }}>
                    <span
                      style={{
                        width: `${Math.round(
                          (entry.minutes / Math.max(1, goalBreakdown[0]?.minutes ?? 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Focus mode comparison</div>
            <div className="section-subtitle">
              How your two modes performed — measured from recorded sessions
            </div>
          </div>
          <ListChecks size={16} style={{ color: 'var(--text-subtle)' }} />
        </div>
        <div className="card-body">
          <div className="grid grid-2">
            {(
              [
                { key: 'flexible', title: 'Flexible Focus', icon: Shield, data: modeBreakdown.flexible },
                { key: 'strict', title: 'Strict Focus', icon: LockIcon, data: modeBreakdown.strict },
              ] as const
            ).map((mode) => (
              <div key={mode.key} className="card card-pad-sm" style={{ background: 'var(--surface-2)' }}>
                <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                  <mode.icon size={15} style={{ color: 'var(--accent-text)' }} />
                  <span className="small" style={{ fontWeight: 600 }}>
                    {mode.title}
                  </span>
                </div>
                {mode.data.sessions === 0 ? (
                  <p className="small subtle">No sessions in this mode yet.</p>
                ) : (
                  <div className="grid grid-3" style={{ gap: 10 }}>
                    <div>
                      <div className="tiny subtle">Sessions</div>
                      <div className="nums" style={{ fontWeight: 650, fontSize: 18 }}>
                        {mode.data.sessions}
                      </div>
                    </div>
                    <div>
                      <div className="tiny subtle">Avg length</div>
                      <div className="nums" style={{ fontWeight: 650, fontSize: 18 }}>
                        {Math.round(mode.data.average)}m
                      </div>
                    </div>
                    <div>
                      <div className="tiny subtle">Blocked</div>
                      <div className="nums" style={{ fontWeight: 650, fontSize: 18 }}>
                        {mode.data.blocked}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="callout" style={{ marginTop: 16 }}>
            <InfoIcon />
            <span>
              These are descriptive counts of your own sessions. LockIn does not measure
              concentration, attention or wellbeing — it only records what you logged.
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

function LockIcon(props: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={props.style}
      aria-hidden="true"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}
