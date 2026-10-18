import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { StartSession } from './pages/StartSession'
import { ActiveSession } from './pages/ActiveSession'
import { AppManagement } from './pages/AppManagement'
import { SessionHistory } from './pages/SessionHistory'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'
import { SessionReport } from './pages/SessionReport'
import { NotFound } from './pages/NotFound'
import { Toaster } from './components/ui/Toaster'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/session" element={<ActiveSession />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/start" element={<StartSession />} />
          <Route path="/apps" element={<AppManagement />} />
          <Route path="/history" element={<SessionHistory />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/report/:id" element={<SessionReport />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}
