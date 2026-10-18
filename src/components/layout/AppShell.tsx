import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, MobileStatusBar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!drawerOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  return (
    <div className="app-shell">
      <Sidebar open={drawerOpen} onNavigate={() => setDrawerOpen(false)} />
      {drawerOpen ? (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}
      <div className="main">
        <TopBar onOpenMenu={() => setDrawerOpen(true)} />
        <MobileStatusBar />
        <Outlet />
      </div>
      <MobileNav />
    </div>
  )
}
