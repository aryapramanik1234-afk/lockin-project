import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useApp } from '../../state/useApp'
import type { ToastMessage } from '../../state/app-context'

const TONE_ICON: Record<ToastMessage['kind'], typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const TONE_COLOR: Record<ToastMessage['kind'], string> = {
  success: 'var(--success)',
  info: 'var(--info)',
  warning: 'var(--warning)',
  error: 'var(--danger)',
}

export function Toaster() {
  const { toasts, actions } = useApp()
  if (!toasts.length) return null

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const IconComponent = TONE_ICON[toast.kind]
        return (
          <div className="toast" key={toast.id}>
            <div
              className="toast-icon"
              style={{ background: `color-mix(in srgb, ${TONE_COLOR[toast.kind]} 16%, transparent)`, color: TONE_COLOR[toast.kind] }}
            >
              <IconComponent size={15} />
            </div>
            <div className="grow">
              <div className="toast-title">{toast.title}</div>
              {toast.body ? <div className="toast-body">{toast.body}</div> : null}
            </div>
            <button
              className="icon-btn"
              style={{ width: 24, height: 24 }}
              aria-label="Dismiss notification"
              onClick={() => actions.dismissToast(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
