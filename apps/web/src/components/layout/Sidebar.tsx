import { NavLink } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import clsx from 'clsx'
import { useShelfStore } from '../../stores/shelfStore'
import { useUserStore } from '../../stores/userStore'

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free',
  READER: 'Reader',
  COLLECTOR: 'Collector',
  BIBLIOPHILE: 'Bibliophile',
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-ink-muted text-slate-200',
  READER: 'bg-shelf-500 text-shelf-50',
  COLLECTOR: 'bg-shelf-600 text-shelf-100',
  BIBLIOPHILE: 'bg-gold text-ink',
}

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

function GridIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function ShopIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

export default function Sidebar() {
  const { user } = useUser()
  const shelves = useShelfStore((s) => s.shelves)
  const plan = useUserStore((s) => s.plan)

  const firstShelfId = shelves[0]?.id ?? 'new'

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <GridIcon /> },
    { to: `/shelf/${firstShelfId}`, label: 'My Shelf', icon: <BookIcon /> },
    { to: '/stats', label: 'Reading Stats', icon: <ChartIcon /> },
    { to: '/notebook', label: 'Notebook', icon: <PencilIcon /> },
    { to: '/wishlist', label: 'Wish List', icon: <HeartIcon /> },
    { to: '/store', label: 'Marketplace', icon: <ShopIcon /> },
    { to: '/settings', label: 'Settings', icon: <GearIcon /> },
  ]

  return (
    <aside className="flex h-full w-60 flex-col bg-ink border-r border-ink-light">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-8 w-8 rounded-lg bg-shelf-500 flex items-center justify-center">
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-shelf-50"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M4 2h4v20H4zM10 2h4v20h-4zM16 2h4v20h-4z" />
          </svg>
        </div>
        <span className="text-shelf-100 font-semibold tracking-tight">Bookshelf</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-shelf-500/20 text-shelf-300'
                  : 'text-slate-400 hover:bg-ink-light hover:text-slate-200',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-ink-light px-4 py-4">
        <div className="flex items-center gap-3">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName ?? 'User avatar'}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-shelf-500 flex items-center justify-center text-shelf-50 text-xs font-bold">
              {user?.firstName?.[0] ?? 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {user?.fullName ?? user?.firstName ?? 'Reader'}
            </p>
            <span
              className={clsx(
                'inline-block rounded-full px-2 py-0.5 text-xs font-semibold leading-none mt-0.5',
                PLAN_COLORS[plan] ?? PLAN_COLORS['FREE'],
              )}
            >
              {PLAN_LABELS[plan] ?? 'Free'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
