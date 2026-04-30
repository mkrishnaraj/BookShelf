import clsx from 'clsx'
import type { Book } from '../../stores/shelfStore'

const STATUS_LABELS: Record<string, string> = {
  WANT_TO_READ: 'Want to read',
  READING: 'Reading',
  READ: 'Read',
  DID_NOT_FINISH: 'Did not finish',
}

const STATUS_COLORS: Record<string, string> = {
  WANT_TO_READ: 'bg-slate-600/40 text-slate-300',
  READING: 'bg-shelf-500/30 text-shelf-300',
  READ: 'bg-green-600/30 text-green-400',
  DID_NOT_FINISH: 'bg-red-600/20 text-red-400',
}

interface BookCardProps {
  book: Book
  onClick?: () => void
  selected?: boolean
}

export default function BookCard({ book, onClick, selected }: BookCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500',
        selected
          ? 'border-shelf-500 bg-shelf-500/10'
          : 'border-ink-muted bg-ink hover:border-shelf-500/50 hover:bg-ink-light',
      )}
    >
      {/* Cover / spine color swatch */}
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          className="h-16 w-12 flex-shrink-0 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="h-16 w-12 flex-shrink-0 rounded flex items-end justify-center pb-1"
          style={{ backgroundColor: book.dominantColor ?? '#8B5E3C' }}
          aria-hidden="true"
        />
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{book.title}</p>
        <p className="truncate text-xs text-slate-400">{book.author}</p>

        {/* Progress bar */}
        <div className="mt-2">
          <div
            className="h-1 w-full rounded-full bg-ink-muted/40"
            role="progressbar"
            aria-valuenow={book.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${book.progressPercent}% read`}
          >
            <div
              className="h-full rounded-full bg-shelf-500 transition-all"
              style={{ width: `${book.progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{book.progressPercent}% read</p>
        </div>

        <span
          className={clsx(
            'mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_COLORS[book.status] ?? 'bg-slate-600/40 text-slate-300',
          )}
        >
          {STATUS_LABELS[book.status] ?? book.status}
        </span>
      </div>
    </button>
  )
}
