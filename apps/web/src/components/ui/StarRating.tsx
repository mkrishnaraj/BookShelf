import clsx from 'clsx'

interface StarRatingProps {
  value: number
  max?: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export default function StarRating({
  value,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  return (
    <div
      className="inline-flex gap-0.5"
      role={readOnly ? 'img' : 'group'}
      aria-label={`Rating: ${value} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1
        const filled = starValue <= value
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(starValue)}
            aria-label={readOnly ? undefined : `Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
            className={clsx(
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-sm transition-transform',
              !readOnly && 'hover:scale-110 cursor-pointer',
              readOnly && 'cursor-default',
            )}
          >
            <svg
              aria-hidden="true"
              className={clsx(
                sizeClass[size],
                filled ? 'text-gold fill-gold' : 'text-ink-muted fill-ink-muted',
              )}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
