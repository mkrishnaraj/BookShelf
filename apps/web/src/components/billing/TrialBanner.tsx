import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

interface TrialBannerProps {
  daysLeft: number
}

export default function TrialBanner({ daysLeft }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const urgent = daysLeft <= 3

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 px-4 py-2.5 text-sm',
        urgent
          ? 'bg-accent/15 border-b border-accent/30 text-accent'
          : 'bg-shelf-500/10 border-b border-shelf-500/20 text-shelf-300',
      )}
    >
      <p>
        {urgent ? (
          <>
            <strong>Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</strong> on your trial. Upgrade now to keep access.
          </>
        ) : (
          <>
            <strong>{daysLeft} days left</strong> on your free trial.
          </>
        )}
      </p>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          to="/pricing"
          className={clsx(
            'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
            urgent
              ? 'bg-accent text-white hover:bg-accent-hover'
              : 'bg-shelf-500 text-shelf-50 hover:bg-shelf-600',
          )}
        >
          Upgrade now
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss trial banner"
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
