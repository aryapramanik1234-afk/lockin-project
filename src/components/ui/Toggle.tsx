export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, id, disabled }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="switch"
      data-on={checked}
      onClick={() => onChange(!checked)}
    />
  )
}
