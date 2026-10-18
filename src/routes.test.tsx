import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { AppProvider } from './state/AppProvider'
import { STORAGE_KEYS } from './lib/storage'

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>,
  )
}

describe('every route renders', () => {
  it('renders the dashboard', async () => {
    renderApp('/')
    expect(
      await screen.findByRole('heading', { name: /Lock distractions/i }),
    ).toBeInTheDocument()
  })

  it('renders the session setup', async () => {
    renderApp('/start')
    expect(await screen.findByRole('heading', { name: /Set up your session/i })).toBeInTheDocument()
  })

  it('renders the app management screen', async () => {
    renderApp('/apps')
    expect(await screen.findByRole('heading', { name: /Apps & websites/i })).toBeInTheDocument()
    expect(screen.getByText(/sample catalog/i)).toBeInTheDocument()
  })

  it('renders the session history', async () => {
    renderApp('/history')
    expect(await screen.findByRole('heading', { name: /Everything you have logged/i })).toBeInTheDocument()
  })

  it('renders the progress page', async () => {
    renderApp('/progress')
    expect(await screen.findByRole('heading', { name: /Your focus, measured/i })).toBeInTheDocument()
  })

  it('renders the settings page', async () => {
    renderApp('/settings')
    expect(await screen.findByRole('heading', { name: /Preferences/i })).toBeInTheDocument()
    expect(screen.getByText(/Reset all demo data/i)).toBeInTheDocument()
  })

  it('renders a friendly 404 page for unknown routes', async () => {
    renderApp('/this-route-does-not-exist')
    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })

  it('renders the report page for a stored session', async () => {
    const now = Date.now()
    window.localStorage.setItem(
      STORAGE_KEYS.history,
      JSON.stringify([
        {
          id: 'report-1',
          goal: 'Statistics revision',
          mode: 'flexible',
          plannedMinutes: 45,
          elapsedSeconds: 2700,
          startedAt: now - 7_200_000,
          endedAt: now - 4_500_000,
          outcome: 'completed',
          restrictedAttempts: 1,
          attempts: [
            {
              itemId: 'youtube',
              itemName: 'YouTube',
              category: 'entertainment',
              at: now - 6_000_000,
              temporarilyAllowed: false,
            },
          ],
          allowedCount: 5,
          restrictedCount: 9,
        },
      ]),
    )
    renderApp('/report/report-1')
    expect(await screen.findByText('Statistics revision')).toBeInTheDocument()
    expect(screen.getAllByText(/45 min/).length).toBeGreaterThan(0)
    expect(screen.getByText('YouTube')).toBeInTheDocument()
  })

  it('shows a report-not-found state for an unknown session', async () => {
    renderApp('/report/does-not-exist')
    expect(await screen.findByText('Report not found')).toBeInTheDocument()
  })
})
