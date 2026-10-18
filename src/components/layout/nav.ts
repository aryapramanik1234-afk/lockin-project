import {
  AppWindow,
  ChartColumn,
  History,
  LayoutDashboard,
  PlayCircle,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Shown in the bottom mobile tab bar. */
  primary?: boolean
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, primary: true },
  { to: '/start', label: 'Start Focus', icon: PlayCircle, primary: true },
  { to: '/apps', label: 'App Management', icon: AppWindow, primary: true },
  { to: '/history', label: 'Session History', icon: History, primary: true },
  { to: '/progress', label: 'Progress', icon: ChartColumn, primary: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary)
