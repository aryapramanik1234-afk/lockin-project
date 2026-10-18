import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export type ModalTone = 'accent' | 'danger' | 'warning' | 'success'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  tone?: ModalTone
  children?: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
  dismissible?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  tone = 'accent',
  children,
  footer,
  size = 'md',
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }, 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      window.clearTimeout(timer)
    }
  }, [open, onClose, dismissible])

  if (!open) return null

  const toneClass =
    tone === 'danger'
      ? 'modal-icon-danger'
      : tone === 'warning'
        ? 'modal-icon-warning'
        : tone === 'success'
          ? 'modal-icon-success'
          : ''

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose()
      }}
    >
      <div
        className={`modal${size === 'lg' ? ' modal-lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
      >
        <div className="modal-header">
          {icon ? <div className={`modal-icon ${toneClass}`}>{icon}</div> : null}
          <div className="grow">
            <h2 className="modal-title">{title}</h2>
            {description ? <p className="small muted" style={{ marginTop: 4 }}>{description}</p> : null}
          </div>
          {dismissible ? (
            <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
              <X size={17} />
            </button>
          ) : null}
        </div>
        {children ? <div className="modal-body">{children}</div> : null}
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
