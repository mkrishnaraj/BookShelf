import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import type { Shelf } from '../../stores/shelfStore'
import Button from '../ui/Button'

const THEME_LABELS: Record<string, string> = {
  DARK_WOOD: 'Dark Wood',
  LIGHT_OAK: 'Light Oak',
  WHITE_MINIMALIST: 'White Minimal',
  VINTAGE: 'Vintage',
}

const THEME_COLORS: Record<string, string> = {
  DARK_WOOD: 'bg-amber-900',
  LIGHT_OAK: 'bg-amber-300',
  WHITE_MINIMALIST: 'bg-slate-100',
  VINTAGE: 'bg-yellow-700',
}

const SIZE_CAPACITY: Record<string, number> = {
  S: 50,
  M: 150,
  L: 300,
  XL: 500,
}

interface ShelfCardProps {
  shelf: Shelf
}

export default function ShelfCard({ shelf }: ShelfCardProps) {
  const navigate = useNavigate()
  const capacity = SIZE_CAPACITY[shelf.size] ?? 50
  const fillPct = Math.min(100, Math.round((shelf.bookCount / capacity) * 100))

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink-muted bg-ink-light p-5 hover:border-shelf-500/60 transition-colors">
      {/* Theme swatch + name */}
      <div className="flex items-center gap-3">
        <div
          className={clsx('h-9 w-9 rounded-lg flex-shrink-0', THEME_COLORS[shelf.theme] ?? 'bg-ink-muted')}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-100">{shelf.name}</p>
          <p className="text-xs text-slate-400">
            {THEME_LABELS[shelf.theme] ?? shelf.theme} · Size {shelf.size}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-slate-400">
          <span>{shelf.bookCount} books</span>
          <span>{capacity} capacity</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-ink-muted/40" role="progressbar" aria-valuenow={fillPct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-shelf-500 transition-all"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate(`/shelf/${shelf.id}`)}
        className="w-full"
      >
        View Shelf
      </Button>
    </div>
  )
}

// Skeleton variant
export function ShelfCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink-muted bg-ink-light p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-ink-muted/40" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-ink-muted/40" />
          <div className="h-3 w-1/2 rounded bg-ink-muted/30" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-ink-muted/30" />
        <div className="h-1.5 w-full rounded-full bg-ink-muted/30" />
      </div>
      <div className="h-8 rounded-lg bg-ink-muted/30" />
    </div>
  )
}
