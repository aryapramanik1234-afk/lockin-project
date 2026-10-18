import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Check, Menu, Moon, Play, Sun, Trash2 } from 'lucide-react'
import { useApp } from '../../state/useApp'
import { NAV_ITEMS } from './nav'
import { Button, IconButton } from '../ui/Button'
import { formatRelative } from '../../lib/format'

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { state, actions, resolvedTheme } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const unread = state.notifications.filter((n) => !n.read).length
  const active = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )
  const pageTitle =
    active?.label ??
    (location.pathname.startsWith('/report')
      ? 'Session Report'
      : location.pathname.startsWith('/session')
        ? 'Focus Session'
        : 'LockIn')

  useEffect(() => {
    if (!bellOpen) return undefined
    const onClick = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [bellOpen])

  useEffect(() => {
    setBellOpen(false)
  }, [location.pathname])

  const toggleTheme = () => {
    actions.updateSettings({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' })
  }

  return (
    <header className="topbar">
      <IconButton label="Open navigation" className="menu-toggle" onClick={onOpenMenu}>
        <Menu size={19} />
      </IconButton>

      <div className="grow" style={{ minWidth: 0 }}>
        <div className="topbar-title truncate">{pageTitle}</div>
      </div>

      <div className="row" style={{ gap: 6 }}>
        <IconButton
          label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
        >
          {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </IconButton>

        <div style={{ position: 'relative' }} ref={bellRef}>
          <IconButton
            label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            active={bellOpen}
            onClick={() => {
              setBellOpen((open) => !open)
              if (!bellOpen) actions.markNotificationsRead()
            }}
          >
            <Bell size={17} />
          </IconButton>
          {unread > 0 ? (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 7,
                height: 7,
                borderRadius: 999,
                background: 'var(--danger)',
                border: '2px solid var(--bg)',
              }}
            />
          ) : null}

          {bellOpen ? (
            <div className="popover" role="dialog" aria-label="Notifications">
              <div className="popover-header">
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Notifications</span>
                {state.notifications.length ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => actions.clearNotifications()}
                  >
                    <Trash2 size={13} />
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="popover-body">
                {state.notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '28px 16px' }}>
                    <div className="empty-icon" style={{ width: 40, height: 40 }}>
                      <Bell size={17} />
                    </div>
                    <div className="empty-title" style={{ fontSize: 14 }}>
                      No notifications yet
                    </div>
                    <p className="empty-desc" style={{ fontSize: 12.5 }}>
                      Session updates appear here while you work.
                    </p>
                  </div>
                ) : (
                  state.notifications.map((note) => (
                    <div
                      key={note.id}
                      className={`notification-item${note.read ? '' : ' unread'}`}
                    >
                      <div
                        className="icon-tile"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          color:
                            note.kind === 'success'
                              ? 'var(--success)'
                              : note.kind === 'warning'
                                ? 'var(--warning)'
                                : 'var(--info)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        <Check size={14} />
                      </div>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 550 }}>{note.title}</div>
                        <div className="small subtle">{note.body}</div>
                        <div className="tiny subtle" style={{ marginTop: 2 }}>
                          {formatRelative(note.at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Play size={14} fill="currentColor" />}
          onClick={() => navigate('/start')}
          className="hide-sm"
        >
          Start Focus
        </Button>
      </div>
    </header>
  )
}
