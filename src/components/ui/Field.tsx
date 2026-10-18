import type { ReactNode } from 'react'

export interface FieldProps {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  action?: ReactNode
}

export function Field({ label, hint, error, htmlFor, children, action }: FieldProps) {
  return (
    <div className="field">
      <div className="row-between">
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <span className="error-text" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  )
}
