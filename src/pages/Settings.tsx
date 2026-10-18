import { useState } from 'react'
import {
  Bell,
  Check,
  Clock,
  Database,
  Monitor,
  Moon,
  Palette,
  RefreshCcw,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Toggle } from '../components/ui/Toggle'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PermissionEditor } from '../components/apps/PermissionEditor'
import { defaultPermissionMap } from '../lib/session'
import { normaliseLists, validateDuration } from '../lib/session'
import type { FocusMode, ThemePreference } from '../types'

const DURATION_PRESETS = [25, 45, 60, 90]

export function Settings() {
  const { state, actions } = useApp()
  const { settings } = state
  const [resetOpen, setResetOpen] = useState(false)
  const [customDuration, setCustomDuration] = useState('')
  const [saved, setSaved] = useState(false)

  const lists = normaliseLists(settings.defaultAllowed, settings.defaultRestricted)

  const flashSaved = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <SlidersHorizontal size={13} />
            Settings
          </div>
          <h1 className="page-title">Preferences</h1>
          <p className="page-subtitle">
            Everything here is stored in this browser and survives a refresh or a closed tab.
          </p>
        </div>
        {saved ? (
          <span className="chip chip-success">
            <Check size={13} />
            Saved
          </span>
        ) : null}
      </div>

      {/* Appearance */}
      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Palette size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
              Appearance
            </div>
            <div className="section-subtitle">Choose how LockIn looks on this device</div>
          </div>
        </div>
        <div className="card-body stack stack-4">
          <div className="row row-wrap" style={{ gap: 10 }}>
            {(
              [
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'system', label: 'System', icon: Monitor },
              ] as { value: ThemePreference; label: string; icon: typeof Moon }[]
            ).map((option) => {
              const selected = settings.theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  className="option"
                  style={{ width: 'auto', flex: '1 1 150px' }}
                  data-selected={selected}
                  onClick={() => {
                    actions.updateSettings({ theme: option.value })
                    flashSaved()
                  }}
                >
                  <div className="option-icon">
                    <option.icon size={18} />
                  </div>
                  <div className="grow">
                    <div className="option-title">{option.label}</div>
                  </div>
                  {selected ? <Check size={17} style={{ color: 'var(--accent)' }} /> : null}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Session defaults */}
      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Clock size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
              Session defaults
            </div>
            <div className="section-subtitle">Pre-filled every time you set up a session</div>
          </div>
        </div>
        <div className="card-body stack stack-5">
          <Field
            label="Default session duration"
            hint="Custom durations between 1 and 240 minutes are supported."
            error={
              !validateDuration(settings.defaultDurationMinutes).valid
                ? validateDuration(settings.defaultDurationMinutes).error
                : undefined
            }
          >
            <div className="row row-wrap" style={{ gap: 8 }}>
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="btn"
                  style={{
                    height: 38,
                    minWidth: 68,
                    borderColor:
                      settings.defaultDurationMinutes === preset && customDuration === ''
                        ? 'var(--accent)'
                        : 'var(--border)',
                    background:
                      settings.defaultDurationMinutes === preset && customDuration === ''
                        ? 'var(--accent-softer)'
                        : 'var(--surface-2)',
                    color:
                      settings.defaultDurationMinutes === preset && customDuration === ''
                        ? 'var(--accent-text)'
                        : 'var(--text)',
                  }}
                  onClick={() => {
                    actions.updateSettings({ defaultDurationMinutes: preset })
                    setCustomDuration('')
                    flashSaved()
                  }}
                >
                  {preset}m
                </button>
              ))}
              <div className="input-icon" style={{ width: 130 }}>
                <Clock size={15} />
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={240}
                  placeholder="Custom"
                  value={customDuration}
                  aria-label="Default custom duration in minutes"
                  onChange={(event) => {
                    const raw = event.target.value
                    setCustomDuration(raw)
                    const parsed = Number(raw)
                    if (raw !== '' && Number.isFinite(parsed) && validateDuration(parsed).valid) {
                      actions.updateSettings({ defaultDurationMinutes: parsed })
                      flashSaved()
                    }
                  }}
                />
              </div>
            </div>
          </Field>

          <Field
            label="Default focus mode"
            hint="Strict Focus always asks for confirmation before it starts."
          >
            <div className="row row-wrap" style={{ gap: 10 }}>
              {(
                [
                  {
                    value: 'flexible',
                    title: 'Flexible Focus',
                    desc: 'Restrictions can be adjusted during the session.',
                  },
                  {
                    value: 'strict',
                    title: 'Strict Focus',
                    desc: 'Restrictions are locked until the session ends.',
                  },
                ] as { value: FocusMode; title: string; desc: string }[]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="option"
                  style={{ flex: '1 1 220px' }}
                  data-selected={settings.defaultMode === option.value}
                  onClick={() => {
                    actions.updateSettings({ defaultMode: option.value })
                    flashSaved()
                  }}
                >
                  <div className="option-icon">
                    {option.value === 'strict' ? <Shield size={18} /> : <SlidersHorizontal size={18} />}
                  </div>
                  <div className="grow">
                    <div className="option-title">{option.title}</div>
                    <div className="option-desc">{option.desc}</div>
                  </div>
                  {settings.defaultMode === option.value ? (
                    <Check size={17} style={{ color: 'var(--accent)' }} />
                  ) : null}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* Default apps */}
      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Shield size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
              Default allowed &amp; restricted apps
            </div>
            <div className="section-subtitle">
              The starting lists for every new session — you can still edit them during setup
            </div>
          </div>
        </div>
        <div className="card-body">
          <PermissionEditor
            allowed={lists.allowed}
            restricted={lists.restricted}
            onChange={({ allowed, restricted }) => {
              actions.updateSettings({ defaultAllowed: allowed, defaultRestricted: restricted })
              flashSaved()
            }}
            mode={settings.defaultMode}
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Bell size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
              Notifications
            </div>
            <div className="section-subtitle">In-app only — LockIn never sends email or SMS</div>
          </div>
        </div>
        <div className="card-body stack stack-4">
          <div className="row-between">
            <div>
              <div className="small" style={{ fontWeight: 550 }}>
                In-app notifications
              </div>
              <div className="tiny subtle">
                Show a toast when a session starts, ends or needs attention
              </div>
            </div>
            <Toggle
              checked={settings.inAppNotifications}
              onChange={(value) => {
                actions.updateSettings({ inAppNotifications: value })
                flashSaved()
              }}
              label="In-app notifications"
            />
          </div>
          <div className="row-between">
            <div>
              <div className="small" style={{ fontWeight: 550 }}>
                Completion chime
              </div>
              <div className="tiny subtle">A short tone when a session reaches its planned end</div>
            </div>
            <Toggle
              checked={settings.completionChime}
              onChange={(value) => {
                actions.updateSettings({ completionChime: value })
                flashSaved()
              }}
              label="Completion chime"
            />
          </div>
          <div className="row-between">
            <div>
              <div className="small" style={{ fontWeight: 550 }}>
                Show the simulation notice
              </div>
              <div className="tiny subtle">
                Keeps the “simulated blocking” reminder visible on the dashboard
              </div>
            </div>
            <Toggle
              checked={settings.showSimulatedBanner}
              onChange={(value) => {
                actions.updateSettings({ showSimulatedBanner: value })
                flashSaved()
              }}
              label="Show the simulation notice"
            />
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Database size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
              Demo data
            </div>
            <div className="section-subtitle">Everything lives in this browser's local storage</div>
          </div>
        </div>
        <div className="card-body stack stack-4">
          <div className="row-between">
            <div>
              <div className="small" style={{ fontWeight: 550 }}>
                Reset the app catalog
              </div>
              <div className="tiny subtle">
                Restore the sample permissions without touching your history
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCcw size={14} />}
              onClick={() => {
                actions.setPermissions(defaultPermissionMap())
                actions.notify('Catalog reset', 'Sample permissions restored.', 'info')
              }}
            >
              Reset catalog
            </Button>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          <div className="row-between">
            <div>
              <div className="small" style={{ fontWeight: 550 }}>
                Load sample sessions
              </div>
              <div className="tiny subtle">
                Nine realistic sessions from the past week, to explore the charts and reports
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={() => actions.loadSampleData()}
            >
              Load samples
            </Button>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          <div className="row-between">
            <div>
              <div className="small" style={{ fontWeight: 550 }}>
                Reset all demo data
              </div>
              <div className="tiny subtle">
                Clears settings, history, permissions and the current session
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => setResetOpen(true)}
            >
              Reset everything
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={resetOpen}
        tone="danger"
        icon={<Trash2 size={18} />}
        title="Reset all demo data?"
        description="This cannot be undone."
        confirmLabel="Reset everything"
        cancelLabel="Cancel"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false)
          actions.resetAll()
        }}
        body={
          <p>
            Your {state.history.length} logged session
            {state.history.length === 1 ? '' : 's'}, preferences and app permissions will be
            cleared and LockIn will return to its factory state.
          </p>
        }
      />

      <div className="callout" style={{ marginTop: 'var(--sp-5)' }}>
        <Volume2 size={15} />
        <span>
          LockIn stores your settings and history with <code>localStorage</code> in this browser
          only. Nothing is uploaded, no account is required and no paid service is used.
        </span>
      </div>
    </div>
  )
}
