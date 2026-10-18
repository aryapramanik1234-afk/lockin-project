import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className="empty-state" style={compact ? { padding: '32px 20px' } : undefined}>
      <div className="empty-icon">{icon}</div>
      <div>
        <div className="empty-title">{title}</div>
        {description ? <p className="empty-desc" style={{ marginTop: 6 }}>{description}</p> : null}
      </div>
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  )
}
