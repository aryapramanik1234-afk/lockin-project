import type { CatalogItem } from '../../types'
import { Icon } from './Icon'

export interface AppIconProps {
  item: CatalogItem
  size?: 'sm' | 'md' | 'lg'
  dimmed?: boolean
}

export function AppIcon({ item, size = 'md', dimmed }: AppIconProps) {
  const pixels = size === 'lg' ? 21 : size === 'md' ? 18 : 15
  const tile = size === 'lg' ? 'icon-tile icon-tile-lg' : 'icon-tile'
  return (
    <div
      className={tile}
      style={{
        color: dimmed ? 'var(--text-subtle)' : item.accent,
        background: dimmed
          ? 'var(--surface-2)'
          : `color-mix(in srgb, ${item.accent} 13%, transparent)`,
        borderColor: dimmed ? 'var(--border)' : `color-mix(in srgb, ${item.accent} 26%, transparent)`,
      }}
      aria-hidden="true"
    >
      <Icon name={item.icon} size={pixels} />
    </div>
  )
}
