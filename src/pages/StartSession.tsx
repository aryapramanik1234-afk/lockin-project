import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Lock,
  Play,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
} from 'lucide-react'
import { useApp } from '../state/useApp'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { PermissionEditor } from '../components/apps/PermissionEditor'
import { getCatalogItem } from '../data/catalog'
import { normaliseLists, validateDuration, validateGoal } from '../lib/session'
import { formatMinutes } from '../lib/format'
import type { FocusMode } from '../types'

const DURATION_PRESETS = [25, 45, 60, 90]

const STEPS = [
  { key: 'goal', label: 'Goal', icon: Target },
  { key: 'mode', label: 'Mode', icon: Shield },
  { key: 'apps', label: 'Apps', icon: SlidersHorizontal },
  { key: 'review', label: 'Review', icon: Check },
]

const GOAL_SUGGESTIONS = [
  'Finish calculus problem set',
  'Revise organic chemistry notes',
  'Read research paper — chapter 3',
  'Write literature review draft',
  'Prepare for data structures quiz',
]

export function StartSession() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const { settings } = state

  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [goalTouched, setGoalTouched] = useState(false)
  const [duration, setDuration] = useState(settings.defaultDurationMinutes)
  const [customDuration, setCustomDuration] = useState('')
  const [mode, setMode] = useState<FocusMode>(settings.defaultMode)
  const [allowed, setAllowed] = useState<string[]>(settings.defaultAllowed)
  const [restricted, setRestricted] = useState<string[]>(settings.defaultRestricted)
  const [strictConfirmOpen, setStrictConfirmOpen] = useState(false)
  const [strictAcknowledged, setStrictAcknowledged] = useState(false)
  const [strictError, setStrictError] = useState('')

  const goalValidation = validateGoal(goal)
  const durationValidation = validateDuration(duration)
  const lists = useMemo(() => normaliseLists(allowed, restricted), [allowed, restricted])

  const canContinue =
    step === 0
      ? goalValidation.valid && durationValidation.valid
      : step === 1
        ? true
        : step === 2
          ? true
          : goalValidation.valid && durationValidation.valid

  const start = () => {
    actions.startSession({
      goal: goal.trim(),
      mode,
      durationMinutes: duration,
      allowed: lists.allowed,
      restricted: lists.restricted,
    })
    navigate('/session')
  }

  const handleStartClick = () => {
    if (mode === 'strict') {
      setStrictAcknowledged(false)
      setStrictError('')
      setStrictConfirmOpen(true)
      return
    }
    start()
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <Sparkles size={13} />
            New focus session
          </div>
          <h1 className="page-title">Set up your session</h1>
          <p className="page-subtitle">
            Four quick steps: name the goal, pick a focus mode, choose which apps are blocked, then
            review before you start.
          </p>
        </div>
        <Link to="/" className="btn btn-ghost">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
      </div>

      {state.activeSession ? (
        <div className="callout callout-accent" style={{ marginBottom: 'var(--sp-5)' }}>
          <Play size={15} />
          <span className="grow">
            You already have an active session ({state.activeSession.goal}). Starting a new one will
            replace it.
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate('/session')}>
            Resume
          </Button>
        </div>
      ) : null}

      {/* Stepper */}
      <div className="card card-pad" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="row" style={{ gap: 6 }}>
          {STEPS.map((item, index) => {
            const done = index < step
            const active = index === step
            return (
              <div
                key={item.key}
                className="row"
                style={{ gap: 6, flex: index < STEPS.length - 1 ? 1 : 'none', minWidth: 0 }}
              >
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  className="row"
                  style={{ gap: 7, minWidth: 0 }}
                  aria-current={active ? 'step' : undefined}
                >
                  <span
                    className="step-dot"
                    data-state={done ? 'done' : active ? 'active' : 'idle'}
                    aria-hidden="true"
                  >
                    {done ? <Check size={12} strokeWidth={3} /> : index + 1}
                  </span>
                  <span
                    className="tiny"
                    style={{
                      fontWeight: active ? 650 : 500,
                      color: active
                        ? 'var(--text)'
                        : done
                          ? 'var(--text-muted)'
                          : 'var(--text-subtle)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
                {index < STEPS.length - 1 ? (
                  <span className="step-line" data-state={done ? 'done' : 'idle'} aria-hidden="true" />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card card-pad-lg anim-in" key={step}>
        {/* ── Step 1: goal + duration ───────────────────────────────────── */}
        {step === 0 ? (
          <div className="stack stack-6">
            <Field
              label="Study goal or subject"
              htmlFor="goal-input"
              error={goalTouched && !goalValidation.valid ? goalValidation.error : undefined}
              hint="This is what shows up in your history and reports."
            >
              <input
                id="goal-input"
                className={`input${goalTouched && !goalValidation.valid ? ' invalid' : ''}`}
                placeholder="e.g. Finish calculus problem set"
                value={goal}
                maxLength={120}
                onChange={(event) => setGoal(event.target.value)}
                onBlur={() => setGoalTouched(true)}
                autoFocus
              />
            </Field>

            <div>
              <div className="label" style={{ marginBottom: 8 }}>
                Quick picks
              </div>
              <div className="row row-wrap" style={{ gap: 8 }}>
                {GOAL_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setGoal(suggestion)
                      setGoalTouched(true)
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Session duration"
              error={!durationValidation.valid ? durationValidation.error : undefined}
              hint="You can pause the timer, but the countdown resumes where it stopped."
            >
              <div className="row row-wrap" style={{ gap: 8 }}>
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="btn"
                    style={{
                      height: 40,
                      minWidth: 72,
                      borderColor:
                        duration === preset && customDuration === ''
                          ? 'var(--accent)'
                          : 'var(--border)',
                      background:
                        duration === preset && customDuration === ''
                          ? 'var(--accent-softer)'
                          : 'var(--surface-2)',
                      color:
                        duration === preset && customDuration === ''
                          ? 'var(--accent-text)'
                          : 'var(--text)',
                    }}
                    onClick={() => {
                      setDuration(preset)
                      setCustomDuration('')
                    }}
                  >
                    {preset}m
                  </button>
                ))}
                <div className="input-icon" style={{ width: 128 }}>
                  <Clock size={15} />
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={240}
                    placeholder="Custom"
                    value={customDuration}
                    aria-label="Custom duration in minutes"
                    onChange={(event) => {
                      const raw = event.target.value
                      setCustomDuration(raw)
                      const parsed = Number(raw)
                      if (raw !== '' && Number.isFinite(parsed)) setDuration(parsed)
                    }}
                  />
                </div>
              </div>
            </Field>

            <div className="callout">
              <Target size={15} />
              <span>
                A typical deep-work block is 25–45 minutes. Longer sessions (60–90 min) suit
                reading, problem sets and writing tasks.
              </span>
            </div>
          </div>
        ) : null}

        {/* ── Step 2: focus mode ───────────────────────────────────────── */}
        {step === 1 ? (
          <div className="stack stack-4">
            <div>
              <h2 className="section-title">
                <Shield size={17} style={{ color: 'var(--accent-text)' }} />
                Choose a focus mode
              </h2>
              <p className="section-subtitle">
                You can still change mode before the session starts.
              </p>
            </div>

            <button
              type="button"
              className="option"
              data-selected={mode === 'flexible'}
              onClick={() => setMode('flexible')}
            >
              <div className="option-icon">
                <SlidersHorizontal size={18} />
              </div>
              <div className="grow">
                <div className="row" style={{ gap: 8 }}>
                  <span className="option-title">Flexible Focus</span>
                  <span className="chip chip-info" style={{ height: 20, fontSize: 10.5 }}>
                    Adjustable
                  </span>
                </div>
                <p className="option-desc">
                  Restrictions can be changed while the session runs. Removing a restriction asks for
                  confirmation first, so you never weaken a session by accident.
                </p>
              </div>
              {mode === 'flexible' ? (
                <Check size={18} style={{ color: 'var(--accent)' }} />
              ) : null}
            </button>

            <button
              type="button"
              className="option"
              data-selected={mode === 'strict'}
              onClick={() => setMode('strict')}
            >
              <div className="option-icon">
                <Lock size={18} />
              </div>
              <div className="grow">
                <div className="row" style={{ gap: 8 }}>
                  <span className="option-title">Strict Focus</span>
                  <span className="chip chip-warning" style={{ height: 20, fontSize: 10.5 }}>
                    Locked
                  </span>
                </div>
                <p className="option-desc">
                  Restrictions are configured before the session and stay locked until it finishes.
                  Essential academic tools — calculator, notes, PDF reader, Classroom — stay
                  available.
                </p>
              </div>
              {mode === 'strict' ? <Check size={18} style={{ color: 'var(--accent)' }} /> : null}
            </button>

            {mode === 'strict' ? (
              <div className="callout callout-warning">
                <AlertTriangle size={15} />
                <span>
                  Strict Focus asks for an explicit confirmation before it starts, and the
                  configuration cannot be edited until the session ends.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Step 3: apps ─────────────────────────────────────────────── */}
        {step === 2 ? (
          <div className="stack stack-4">
            <div>
              <h2 className="section-title">
                <SlidersHorizontal size={17} style={{ color: 'var(--accent-text)' }} />
                Configure app permissions
              </h2>
              <p className="section-subtitle">
                Pick the apps and websites that stay reachable, and the ones that get blocked
                inside the session simulator.
              </p>
            </div>
            <PermissionEditor
              allowed={lists.allowed}
              restricted={lists.restricted}
              onChange={({ allowed: nextAllowed, restricted: nextRestricted }) => {
                setAllowed(nextAllowed)
                setRestricted(nextRestricted)
              }}
              mode={mode}
            />
            <div className="callout">
              <Shield size={15} />
              <span>
                This catalog is sample data. LockIn does not scan the apps installed on your device —
                real blocking would need native operating-system permissions.
              </span>
            </div>
          </div>
        ) : null}

        {/* ── Step 4: review ───────────────────────────────────────────── */}
        {step === 3 ? (
          <div className="stack stack-5">
            <div>
              <h2 className="section-title">
                <Check size={17} style={{ color: 'var(--success)' }} />
                Review and start
              </h2>
              <p className="section-subtitle">
                Check the summary below before the timer starts.
              </p>
            </div>

            <div className="grid grid-2">
              <div className="card card-pad-sm" style={{ background: 'var(--surface-inset)' }}>
                <div className="stat-label" style={{ marginBottom: 4 }}>
                  <Target size={13} />
                  Study goal
                </div>
                <div style={{ fontWeight: 600 }}>{goal.trim()}</div>
              </div>
              <div className="card card-pad-sm" style={{ background: 'var(--surface-inset)' }}>
                <div className="stat-label" style={{ marginBottom: 4 }}>
                  <Clock size={13} />
                  Duration
                </div>
                <div style={{ fontWeight: 600 }}>
                  {formatMinutes(duration)} ({duration} minutes)
                </div>
              </div>
              <div className="card card-pad-sm" style={{ background: 'var(--surface-inset)' }}>
                <div className="stat-label" style={{ marginBottom: 4 }}>
                  <Shield size={13} />
                  Focus mode
                </div>
                <div style={{ fontWeight: 600 }}>
                  {mode === 'strict' ? 'Strict Focus (locked)' : 'Flexible Focus (adjustable)'}
                </div>
              </div>
              <div className="card card-pad-sm" style={{ background: 'var(--surface-inset)' }}>
                <div className="stat-label" style={{ marginBottom: 4 }}>
                  <Lock size={13} />
                  Restrictions
                </div>
                <div style={{ fontWeight: 600 }}>
                  {lists.restricted.length} restricted · {lists.allowed.length} allowed
                </div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card card-pad-sm">
                <div className="card-title" style={{ color: 'var(--success)', marginBottom: 8 }}>
                  Allowed ({lists.allowed.length})
                </div>
                {lists.allowed.length ? (
                  <div className="row row-wrap" style={{ gap: 6 }}>
                    {lists.allowed.map((id) => (
                      <span key={id} className="chip chip-success">
                        {getCatalogItem(id)?.name ?? id}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="small subtle">Nothing explicitly allowed.</p>
                )}
              </div>
              <div className="card card-pad-sm">
                <div className="card-title" style={{ color: 'var(--danger)', marginBottom: 8 }}>
                  Restricted ({lists.restricted.length})
                </div>
                {lists.restricted.length ? (
                  <div className="row row-wrap" style={{ gap: 6 }}>
                    {lists.restricted.map((id) => (
                      <span key={id} className="chip chip-danger">
                        {getCatalogItem(id)?.name ?? id}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="small subtle">Nothing restricted — your session runs unrestricted.</p>
                )}
              </div>
            </div>

            {mode === 'strict' ? (
              <div className="callout callout-warning">
                <Lock size={15} />
                <span>
                  You are starting <strong style={{ color: 'var(--text)' }}>Strict Focus</strong>. The
                  permission list above is locked for the whole session and a confirmation is
                  required to begin.
                </span>
              </div>
            ) : (
              <div className="callout callout-accent">
                <Shield size={15} />
                <span>
                  Restrictions can still be adjusted from the session screen in Flexible Focus.
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer navigation */}
        <div
          className="row-between"
          style={{ marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--border)' }}
        >
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? navigate('/') : setStep((s) => s - 1))}
            icon={<ArrowLeft size={15} />}
          >
            {step === 0 ? 'Back to dashboard' : 'Back'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => {
                if (step === 0) setGoalTouched(true)
                if (!canContinue) return
                setStep((s) => s + 1)
              }}
              trailingIcon={<ArrowRight size={15} />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartClick}
              icon={mode === 'strict' ? <Lock size={15} /> : <Play size={15} fill="currentColor" />}
            >
              {mode === 'strict' ? 'Start Strict Focus' : 'Start Session'}
            </Button>
          )}
        </div>
      </div>

      {/* Strict Focus confirmation */}
      <Modal
        open={strictConfirmOpen}
        onClose={() => setStrictConfirmOpen(false)}
        title="Start Strict Focus?"
        description="This locks your restriction settings for the whole session."
        tone="warning"
        icon={<Lock size={19} />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setStrictConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!strictAcknowledged}
              onClick={() => {
                if (!strictAcknowledged) {
                  setStrictError('Confirm the lock before starting.')
                  return
                }
                setStrictConfirmOpen(false)
                start()
              }}
            >
              Start Strict Focus
            </Button>
          </>
        }
      >
        <div className="stack stack-4">
          <div className="callout callout-warning">
            <AlertTriangle size={15} />
            <span>
              While Strict Focus is running you cannot add or remove restrictions from the
              interface. Essential academic tools stay available.
            </span>
          </div>
          <label className="row" style={{ gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={strictAcknowledged}
              onChange={(event) => setStrictAcknowledged(event.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <span className="small">
              I understand the restrictions are locked until the session ends, and that this
              prototype simulates blocking inside the page only.
            </span>
          </label>
          {strictError ? <span className="error-text">{strictError}</span> : null}
        </div>
      </Modal>
    </div>
  )
}
