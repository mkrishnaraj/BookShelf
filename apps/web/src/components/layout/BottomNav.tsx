import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useShelfStore } from '../../stores/shelfStore'

function GridIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
    isActive ? 'text-shelf-300' : 'text-slate-400',
  )

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const shelves = useShelfStore((s) => s.shelves)
  const firstShelfId = shelves[0]?.id ?? 'new'

  return (
    <>
      {/* Overlay for "More" dropdown */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-30"
          aria-hidden="true"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More dropdown */}
      {moreOpen && (
        <div className="fixed bottom-16 right-2 z-40 rounded-xl bg-ink-light border border-ink-muted shadow-lg py-1 min-w-40">
          <NavLink
            to="/notebook"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-ink hover:text-slate-100"
          >
            Notebook
          </NavLink>
          <NavLink
            to="/store"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-ink hover:text-slate-100"
          >
            Marketplace
          </NavLink>
          <NavLink
            to="/settings"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-ink hover:text-slate-100"
          >
            Settings
          </NavLink>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around border-t border-ink-light bg-ink"
        aria-label="Mobile navigation"
      >
        <NavLink to="/dashboard" className={navLinkClass}>
          <GridIcon />
          <span>Home</span>
        </NavLink>

        <NavLink to={`/shelf/${firstShelfId}`} className={navLinkClass}>
          <BookIcon />
          <span>My Shelf</span>
        </NavLink>

        <NavLink to="/stats" className={navLinkClass}>
          <ChartIcon />
          <span>Stats</span>
        </NavLink>

        <NavLink to="/wishlist" className={navLinkClass}>
          <HeartIcon />
          <span>Wishlist</span>
        </NavLink>

        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={clsx(
            'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
            moreOpen ? 'text-shelf-300' : 'text-slate-400',
          )}
          aria-label="More navigation options"
          aria-expanded={moreOpen}
        >
          <DotsIcon />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
