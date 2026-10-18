import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { AppProvider } from './state/AppProvider'
import { STORAGE_KEYS } from './lib/storage'
import type { ActiveSession } from './types'

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>,
  )
}

function seedActiveSession(overrides: Partial<ActiveSession> = {}) {
  const session: ActiveSession = {
    id: 'session-seeded',
    goal: 'Revise linear algebra',
    mode: 'flexible',
    plannedMinutes: 25,
    startedAt: Date.now(),
    pausedMs: 0,
    pausedAt: null,
    status: 'running',
    allowed: ['notes', 'calculator'],
    restricted: ['youtube', 'instagram'],
    attempts: [],
    temporaryAllows: [],
    ...overrides,
  }
  window.localStorage.setItem(STORAGE_KEYS.activeSession, JSON.stringify(session))
  return session
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */

describe('dashboard', () => {
  it('shows the branding, tagline and empty states', async () => {
    renderApp('/')
    expect(
      await screen.findByRole('heading', { name: /Lock distractions/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('No focus data yet')).toBeInTheDocument()
    expect(screen.getByText('No sessions completed yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Focus Session/i })).toBeInTheDocument()
  })

  it('shows recorded numbers once sessions exist', async () => {
    const now = Date.now()
    window.localStorage.setItem(
      STORAGE_KEYS.history,
      JSON.stringify([
        {
          id: 'r1',
          goal: 'Calculus problem set',
          mode: 'flexible',
          plannedMinutes: 45,
          elapsedSeconds: 2700,
          startedAt: now - 3_600_000,
          endedAt: now - 900_000,
          outcome: 'completed',
          restrictedAttempts: 2,
          attempts: [],
          allowedCount: 4,
          restrictedCount: 6,
        },
      ]),
    )
    renderApp('/')
    expect(await screen.findByText('Calculus problem set')).toBeInTheDocument()
    expect(screen.getByText('Completed sessions')).toBeInTheDocument()
    expect(screen.getAllByText('45m').length).toBeGreaterThan(0)
  })
})

/* ── Setup wizard ─────────────────────────────────────────────────────────── */

describe('focus session setup', () => {
  it('walks through goal, mode, apps and review before starting', async () => {
    const user = userEvent.setup()
    renderApp('/start')

    const goal = await screen.findByLabelText(/Study goal or subject/i)
    await user.type(goal, 'Finish calculus problem set')

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText(/Choose a focus mode/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Flexible Focus/i }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText(/Configure app permissions/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText(/Review and start/i)).toBeInTheDocument()
    expect(screen.getByText('Finish calculus problem set')).toBeInTheDocument()
  })

  it('refuses to continue without a valid study goal', async () => {
    const user = userEvent.setup()
    renderApp('/start')
    await screen.findByLabelText(/Study goal or subject/i)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.queryByText(/Choose a focus mode/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Add a study goal/i)).toBeInTheDocument()
  })

  it('requires an explicit confirmation before Strict Focus starts', async () => {
    const user = userEvent.setup()
    renderApp('/start')

    await user.type(await screen.findByLabelText(/Study goal or subject/i), 'Physics revision')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: /Strict Focus/i }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await user.click(await screen.findByRole('button', { name: /Start Strict Focus/i }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Start Strict Focus\?/i)).toBeInTheDocument()
    const confirm = within(dialog).getByRole('button', { name: 'Start Strict Focus' })
    expect(confirm).toBeDisabled()

    await user.click(within(dialog).getByRole('checkbox'))
    expect(confirm).toBeEnabled()
  })
})

/* ── Active session ───────────────────────────────────────────────────────── */

describe('active session', () => {
  it('resumes a running session after a refresh and counts down', async () => {
    seedActiveSession({
      startedAt: Date.now() - 24 * 60_000,
      plannedMinutes: 25,
    })
    renderApp('/session')
    expect(await screen.findByText('01:00')).toBeInTheDocument()
    expect(screen.getAllByText('Revise linear algebra').length).toBeGreaterThan(0)
  })

  it('blocks a restricted app and logs the attempt', async () => {
    const user = userEvent.setup()
    seedActiveSession()
    renderApp('/session')

    const launcherButton = await screen.findByRole('button', { name: /YouTube/i })
    await user.click(launcherButton)

    expect(
      await screen.findByText(
        /Stay focused\. This activity is restricted during your study session\./i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/Attempt #1 has been logged/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Back to my session/i }))
    expect(screen.getByText(/Blocked attempts/i)).toBeInTheDocument()
  })

  it('lets an allowed app open in the simulator', async () => {
    const user = userEvent.setup()
    seedActiveSession()
    renderApp('/session')

    const allowedButton = await screen.findByRole('button', { name: /Calculator/i })
    await user.click(allowedButton)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Calculator')).toBeInTheDocument()
  })

  it('locks the restriction settings in Strict Focus', async () => {
    seedActiveSession({ mode: 'strict' })
    renderApp('/session')

    expect(await screen.findByText('Strict Focus')).toBeInTheDocument()
    expect(screen.getByText(/Restrictions locked/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Adjust$/i })).not.toBeInTheDocument()
  })

  it('asks for confirmation before removing a restriction in Flexible Focus', async () => {
    const user = userEvent.setup()
    seedActiveSession()
    renderApp('/session')

    await user.click(await screen.findByRole('button', { name: /^Adjust$/i }))
    const editor = await screen.findByRole('dialog')

    // The YouTube row inside the editor: click its "No rule" button.
    const youtubeRow = within(editor).getByText('YouTube').closest('div.list-row')
    expect(youtubeRow).toBeTruthy()
    const noRuleButton = within(youtubeRow as HTMLElement).getByRole('button', {
      name: 'No rule',
    })
    await user.click(noRuleButton)

    const warning = await screen.findByRole('dialog', { name: /Remove this restriction\?/i })
    expect(warning).toBeInTheDocument()
  })

  it('pauses and resumes the countdown', async () => {
    const user = userEvent.setup()
    seedActiveSession({ startedAt: Date.now() - 60_000 })
    renderApp('/session')

    await user.click(await screen.findByRole('button', { name: 'Pause' }))
    expect((await screen.findAllByText('Paused')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Resume' }))
    expect(screen.getByText('Remaining')).toBeInTheDocument()
  })

  it('completes automatically when the planned time is used up', async () => {
    seedActiveSession({ startedAt: Date.now() - 26 * 60_000, plannedMinutes: 25 })
    renderApp('/session')
    expect(
      (await screen.findAllByText(/Session complete/i, undefined, { timeout: 4000 })).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Revise linear algebra').length).toBeGreaterThan(0)
  })
})

/* ── Ending a session ─────────────────────────────────────────────────────── */

describe('ending a session', () => {
  it('confirms before ending early and stores the record', async () => {
    const user = userEvent.setup()
    seedActiveSession()
    renderApp('/session')

    await user.click(await screen.findByRole('button', { name: /End session/i }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/End this session early\?/i)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'End session' }))

    expect((await screen.findAllByText(/You stopped early/i)).length).toBeGreaterThan(0)
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.history) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].outcome).toBe('ended-early')
  })
})

/* ── History and settings ─────────────────────────────────────────────────── */

describe('history', () => {
  it('lists stored sessions and opens their report', async () => {
    const user = userEvent.setup()
    const now = Date.now()
    window.localStorage.setItem(
      STORAGE_KEYS.history,
      JSON.stringify([
        {
          id: 'r1',
          goal: 'Organic chemistry notes',
          mode: 'strict',
          plannedMinutes: 60,
          elapsedSeconds: 3600,
          startedAt: now - 7_200_000,
          endedAt: now - 3_600_000,
          outcome: 'completed',
          restrictedAttempts: 1,
          attempts: [],
          allowedCount: 5,
          restrictedCount: 7,
        },
      ]),
    )
    renderApp('/history')

    expect(await screen.findByText('Organic chemistry notes')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Report/i }))
    expect((await screen.findAllByText(/Session complete/i)).length).toBeGreaterThan(0)
    expect(screen.getByText('Strict')).toBeInTheDocument()
  })

  it('shows an empty state when nothing is logged', async () => {
    renderApp('/history')
    expect(await screen.findByText('No sessions completed yet')).toBeInTheDocument()
  })
})

describe('settings', () => {
  it('persists the theme choice in local storage', async () => {
    const user = userEvent.setup()
    renderApp('/settings')

    await user.click(await screen.findByRole('button', { name: 'Light' }))
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.settings) ?? '{}')
      expect(saved.theme).toBe('light')
    })
  })

  it('resets the demo data', async () => {
    const user = userEvent.setup()
    renderApp('/settings')

    await user.click(await screen.findByRole('button', { name: /Reset everything/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /Reset everything/i }))

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEYS.history)
      expect(stored === null || stored === '[]').toBe(true)
    })
  })
})
