import { ShieldAlert, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { AppIcon } from '../ui/AppIcon'
import type { CatalogItem } from '../../types'

export interface RestrictionOverlayProps {
  item: CatalogItem
  attemptNumber: number
  onClose: () => void
  mode: 'flexible' | 'strict'
}

/**
 * The simulated "you tried to open a blocked app" screen.
 * The wording is fixed by the product spec.
 */
export function RestrictionOverlay({
  item,
  attemptNumber,
  onClose,
  mode,
}: RestrictionOverlayProps) {
  return (
    <div className="restriction-screen" role="alertdialog" aria-label="Restricted activity">
      <div className="restriction-card">
        <div className="restriction-shield">
          <ShieldAlert size={28} />
        </div>
        <h2 className="modal-title" style={{ fontSize: 20, marginBottom: 10 }}>
          Stay focused. This activity is restricted during your study session.
        </h2>
        <p className="small muted" style={{ maxWidth: '42ch', margin: '0 auto 18px' }}>
          <strong style={{ color: 'var(--text)' }}>{item.name}</strong>
          {item.domain ? ` (${item.domain})` : ''} is on your restricted list for this session.
          Attempt #{attemptNumber} has been logged in the session report.
        </p>

        <div
          className="row"
          style={{
            justifyContent: 'center',
            gap: 10,
            marginBottom: 22,
            padding: '10px 14px',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            width: 'fit-content',
            margin: '0 auto 22px',
          }}
        >
          <AppIcon item={item} size="sm" />
          <div style={{ textAlign: 'left' }}>
            <div className="small" style={{ fontWeight: 550 }}>
              {item.name}
            </div>
            <div className="tiny subtle">
              {mode === 'strict'
                ? 'Strict Focus — restrictions are locked for this session'
                : 'Flexible Focus — you can adjust this in the session panel'}
            </div>
          </div>
        </div>

        <Button variant="primary" size="lg" onClick={onClose} icon={<X size={16} />}>
          Back to my session
        </Button>

        <p className="tiny subtle" style={{ marginTop: 18 }}>
          Simulation only — a real build would ask the operating system to block the app.
        </p>
      </div>
    </div>
  )
}
