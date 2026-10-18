import type { ReactNode } from 'react'

export interface StatCardProps {
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  foot?: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning'
  delay?: number
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  foot,
  tone = 'default',
  delay = 0,
}: StatCardProps) {
  const valueClass =
    tone === 'accent'
      ? 'stat-accent'
      : tone === 'success'
        ? 'stat-success'
        : tone === 'warning'
          ? 'stat-warning'
          : ''

  return (
    <div className="card stat anim-in" style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <div className="stat-label">
        {icon}
        {label}
      </div>
      <div className={`stat-value ${valueClass}`}>
        {value}
        {unit ? <small>{unit}</small> : null}
      </div>
      {foot ? <div className="stat-foot">{foot}</div> : null}
    </div>
  )
}
