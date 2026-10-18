import { useMemo, useState } from 'react'
import { Ban, Check, Lock, Minus, Search } from 'lucide-react'
import { APP_CATALOG, APP_CATEGORIES, getCatalogItem } from '../../data/catalog'
import type { AppCategoryId, FocusMode, Permission } from '../../types'
import { AppIcon } from '../ui/AppIcon'
import { Segmented } from '../ui/Segmented'

export interface PermissionLists {
  allowed: string[]
  restricted: string[]
}

export interface PermissionEditorProps {
  allowed: string[]
  restricted: string[]
  onChange: (lists: PermissionLists) => void
  mode?: FocusMode
  /** When true every control is disabled (Strict Focus lock). */
  locked?: boolean
  temporaryAllows?: { itemId: string; until: number }[]
  onTemporaryAllow?: (itemId: string, minutes: number) => void
  /** Duration used by the "temporarily allow" shortcut. */
  temporaryAllowMinutes?: number
  /** Hide the search + category toolbar (used inside smaller panels). */
  compact?: boolean
}

type Filter = 'all' | 'allowed' | 'restricted'

export function PermissionEditor({
  allowed,
  restricted,
  onChange,
  mode = 'flexible',
  locked = false,
  temporaryAllows = [],
  onTemporaryAllow,
  temporaryAllowMinutes = 15,
  compact = false,
}: PermissionEditorProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<AppCategoryId | 'all'>('all')
  const [filter, setFilter] = useState<Filter>('all')

  const allowedSet = useMemo(() => new Set(allowed), [allowed])
  const restrictedSet = useMemo(() => new Set(restricted), [restricted])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return APP_CATALOG.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (filter === 'allowed' && !allowedSet.has(item.id)) return false
      if (filter === 'restricted' && !restrictedSet.has(item.id)) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        (item.domain ?? '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    })
  }, [query, category, filter, allowedSet, restrictedSet])

  const apply = (itemId: string, permission: Permission) => {
    if (locked) return
    const nextAllowed = new Set(allowedSet)
    const nextRestricted = new Set(restrictedSet)
    nextAllowed.delete(itemId)
    nextRestricted.delete(itemId)
    if (permission === 'allowed') nextAllowed.add(itemId)
    if (permission === 'restricted') nextRestricted.add(itemId)
    onChange({ allowed: Array.from(nextAllowed), restricted: Array.from(nextRestricted) })
  }

  const permissionOf = (itemId: string): Permission => {
    if (allowedSet.has(itemId)) return 'allowed'
    if (restrictedSet.has(itemId)) return 'restricted'
    return 'neutral'
  }

  return (
    <div className="stack stack-4">
      {!compact ? (
        <div className="stack stack-3">
          <div className="input-icon">
            <Search size={15} />
            <input
              className="input"
              placeholder="Search apps and websites…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search apps and websites"
            />
          </div>
          <div className="row-between row-wrap" style={{ gap: 'var(--sp-3)' }}>
            <div className="row row-wrap" style={{ gap: 6, flex: '1 1 320px' }}>
              <button
                className={`chip${category === 'all' ? ' chip-accent' : ''}`}
                onClick={() => setCategory('all')}
                type="button"
              >
                All categories
              </button>
              {APP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`chip${category === cat.id ? ' chip-accent' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <Segmented
              options={[
                { value: 'all', label: 'All' },
                { value: 'allowed', label: 'Allowed' },
                { value: 'restricted', label: 'Restricted' },
              ]}
              value={filter}
              onChange={setFilter}
              ariaLabel="Filter by permission"
            />
          </div>
        </div>
      ) : null}

      <div className="row-between">
        <span className="small muted">
          <strong style={{ color: 'var(--success)' }}>{allowed.length} allowed</strong>
          {' · '}
          <strong style={{ color: 'var(--danger)' }}>{restricted.length} restricted</strong>
        </span>
        {locked ? (
          <span className="chip chip-warning">
            <Lock size={12} />
            Locked
          </span>
        ) : null}
      </div>

      <div
        className="stack"
        style={{
          gap: 0,
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
          maxHeight: 460,
          overflowY: 'auto',
        }}
      >
        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-icon" style={{ width: 40, height: 40 }}>
              <Search size={17} />
            </div>
            <div className="empty-title" style={{ fontSize: 14 }}>
              Nothing matches
            </div>
            <p className="empty-desc" style={{ fontSize: 12.5 }}>
              Try a different search term or category.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const permission = permissionOf(item.id)
            const essentialLocked = mode === 'strict' && item.essential
            const temporary = temporaryAllows.find(
              (t) => t.itemId === item.id && t.until > Date.now(),
            )
            return (
              <div
                key={item.id}
                className="list-row"
                style={{ padding: '10px 12px', gap: 'var(--sp-3)' }}
              >
                <AppIcon item={item} size="sm" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="small truncate" style={{ fontWeight: 550 }}>
                      {item.name}
                    </span>
                    {item.essential ? (
                      <span className="chip chip-success" style={{ height: 19, fontSize: 10.5 }}>
                        Essential
                      </span>
                    ) : null}
                    {temporary ? (
                      <span className="chip chip-info" style={{ height: 19, fontSize: 10.5 }}>
                        Temp. allowed
                      </span>
                    ) : null}
                  </div>
                  <div className="tiny subtle truncate">
                    {item.domain ?? item.description}
                  </div>
                </div>

                <div className="row" style={{ gap: 4, flexShrink: 0 }}>
                  {permission === 'restricted' && onTemporaryAllow && !locked ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ height: 28, fontSize: 11.5 }}
                      onClick={() => onTemporaryAllow(item.id, temporaryAllowMinutes)}
                      title={`Allow this app for ${temporaryAllowMinutes} minutes`}
                    >
                      +{temporaryAllowMinutes}m
                    </button>
                  ) : null}
                  <PermissionControl
                    value={permission}
                    disabled={locked}
                    restrictDisabled={essentialLocked}
                    onChange={(next) => apply(item.id, next)}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {mode === 'strict' ? (
        <div className="callout callout-warning">
          <Lock size={15} />
          <span>
            Strict Focus keeps academic essentials available. Essential tools such as{' '}
            {APP_CATALOG.filter((i) => i.essential)
              .slice(0, 3)
              .map((i) => i.name)
              .join(', ')}{' '}
            cannot be restricted.
          </span>
        </div>
      ) : null}
    </div>
  )
}

export function PermissionControl({
  value,
  onChange,
  disabled = false,
  restrictDisabled = false,
}: {
  value: Permission
  onChange: (permission: Permission) => void
  disabled?: boolean
  restrictDisabled?: boolean
}) {
  const options: { key: Permission; icon: typeof Check; label: string }[] = [
    { key: 'allowed', icon: Check, label: 'Allow' },
    { key: 'restricted', icon: Ban, label: 'Restrict' },
    { key: 'neutral', icon: Minus, label: 'No rule' },
  ]
  return (
    <div className="segmented" role="group" aria-label="Permission">
      {options.map((option) => {
        const isActive = value === option.key
        const blocked = disabled || (option.key === 'restricted' && restrictDisabled)
        return (
          <button
            key={option.key}
            type="button"
            disabled={blocked}
            aria-pressed={isActive}
            aria-label={option.label}
            title={blocked && option.key === 'restricted' ? 'Essential tools stay available' : option.label}
            onClick={() => onChange(option.key)}
            style={{
              padding: '0 8px',
              display: 'inline-flex',
              alignItems: 'center',
              color: isActive
                ? option.key === 'allowed'
                  ? 'var(--success)'
                  : option.key === 'restricted'
                    ? 'var(--danger)'
                    : 'var(--text)'
                : undefined,
              opacity: blocked ? 0.35 : 1,
            }}
          >
            {option.key === 'restricted' && restrictDisabled ? (
              <Lock size={13} />
            ) : (
              <option.icon size={13} />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function permissionLabel(permission: Permission): string {
  if (permission === 'allowed') return 'Allowed'
  if (permission === 'restricted') return 'Restricted'
  return 'No rule'
}

export function itemName(id: string): string {
  return getCatalogItem(id)?.name ?? id
}
