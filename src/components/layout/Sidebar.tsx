import { NavLink } from 'react-router-dom'
import { Lock, Play, ShieldCheck, Zap } from 'lucide-react'
import { NAV_ITEMS } from './nav'
import { useApp } from '../../state/useApp'
import { formatClock } from '../../lib/format'
import { remainingSeconds } from '../../lib/session'
import { useNow } from '../../hooks/useNow'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <Lock size={19} strokeWidth={2.2} />
      </div>
      {!compact ? (
        <div>
          <div className="brand-name">LockIn</div>
          <div className="brand-tag">Lock distractions. Unlock your potential.</div>
        </div>
      ) : null}
    </div>
  )
}

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { state } = useApp()
  const now = useNow(1000)
  const session = state.activeSession

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Main navigation">
      <Brand />

      <nav className="stack stack-2">
        <div className="nav-group-label" style={{ paddingTop: 0 }}>
          Focus
        </div>
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={17} strokeWidth={1.9} />
            {item.label}
          </NavLink>
        ))}
        <div className="nav-group-label">System</div>
        {NAV_ITEMS.slice(5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={17} strokeWidth={1.9} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer stack stack-3">
        {session ? (
          <NavLink
            to="/session"
            onClick={onNavigate}
            className="card card-pad-sm"
            style={{
              borderColor: 'var(--border-accent)',
              background: 'var(--accent-softer)',
              display: 'block',
            }}
          >
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="chip chip-accent" style={{ height: 22, fontSize: 11 }}>
                <span className="badge-dot pulse-dot" />
                {session.mode === 'strict' ? 'Strict' : 'Flexible'}
              </span>
              <span className="tiny subtle">in progress</span>
            </div>
            <div className="small truncate" style={{ fontWeight: 550 }}>
              {session.goal}
            </div>
            <div
              className="mono"
              style={{ fontSize: 20, letterSpacing: '-0.03em', marginTop: 4 }}
            >
              {formatClock(remainingSeconds(session, now))}
            </div>
          </NavLink>
        ) : (
          <NavLink
            to="/start"
            onClick={onNavigate}
            className="btn btn-primary btn-block"
            style={{ height: 42 }}
          >
            <Play size={15} fill="currentColor" />
            Start Focus Session
          </NavLink>
        )}

        <div className="callout" style={{ padding: 10, fontSize: 11.5, lineHeight: 1.45 }}>
          <ShieldCheck size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--text)' }}>Simulation only.</strong> LockIn models app
            blocking inside this page. Real device-level blocking needs native OS access.
          </span>
        </div>
      </div>
    </aside>
  )
}

export function MobileStatusBar() {
  const { state } = useApp()
  const now = useNow(1000)
  const session = state.activeSession
  if (!session) return null
  return (
    <div
      className="row-between"
      style={{
        padding: '8px 16px',
        background: 'var(--accent-softer)',
        borderBottom: '1px solid var(--border)',
        fontSize: 12.5,
      }}
    >
      <span className="row" style={{ gap: 6 }}>
        <Zap size={13} style={{ color: 'var(--accent-text)' }} />
        <span className="truncate" style={{ maxWidth: '55vw' }}>
          {session.goal}
        </span>
      </span>
      <span className="mono" style={{ fontWeight: 600 }}>
        {formatClock(remainingSeconds(session, now))}
      </span>
    </div>
  )
}
