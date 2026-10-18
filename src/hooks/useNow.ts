import { useEffect, useState } from 'react'

/**
 * A single shared clock for the whole app.
 *
 * Every component that needs a live timestamp subscribes to one interval, so
 * the app never runs competing timers — a single tick drives the countdown,
 * the progress ring and the sidebars.
 */
type Listener = (now: number) => void

const listeners = new Set<Listener>()
let intervalId: number | null = null

function ensureTicker() {
  if (intervalId !== null) return
  if (typeof window === 'undefined') return
  intervalId = window.setInterval(() => {
    const now = Date.now()
    listeners.forEach((listener) => listener(now))
  }, 1000)
}

function releaseTicker() {
  if (listeners.size > 0) return
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

export function useNow(_intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const listener: Listener = (value) => setNow(value)
    listeners.add(listener)
    ensureTicker()
    setNow(Date.now())
    return () => {
      listeners.delete(listener)
      releaseTicker()
    }
  }, [])

  return now
}
