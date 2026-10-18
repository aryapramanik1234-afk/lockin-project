import { NavLink } from 'react-router-dom'
import { MOBILE_NAV_ITEMS } from './nav'

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      <div className="mobile-nav-items">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <item.icon size={19} strokeWidth={1.9} />
            {item.label.split(' ')[0]}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
