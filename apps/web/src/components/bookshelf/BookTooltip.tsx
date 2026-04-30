import React, { useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import type { BookData } from './types'

interface BookTooltipProps {
  book: BookData
  /** Position in world units: placed at the top of the book */
  offsetY: number
}

const STATUS_LABELS: Record<string, string> = {
  READ: 'Read',
  READING: 'Reading',
  TO_READ: 'To Read',
  DNF: 'Did Not Finish',
}

const STATUS_CLASSES: Record<string, string> = {
  READ: 'bg-green-600 text-white',
  READING: 'bg-blue-600 text-white',
  TO_READ: 'bg-gray-500 text-white',
  DNF: 'bg-red-700 text-white',
}

/**
 * HTML overlay tooltip shown when hovering a book in the 3D scene.
 * Uses @react-three/drei's <Html> to attach to a 3D position.
 * Auto-dismisses after 3 s of no hover via parent controlling its render.
 */
const BookTooltip = React.memo(function BookTooltip({
  book,
  offsetY,
}: BookTooltipProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const statusLabel = STATUS_LABELS[book.status] ?? book.status
  const statusClass = STATUS_CLASSES[book.status] ?? 'bg-gray-500 text-white'

  const progressBarWidth = `${book.percentRead}%`
  const progressColor =
    book.percentRead >= 75
      ? 'bg-green-500'
      : book.percentRead >= 25
        ? 'bg-yellow-400'
        : 'bg-red-500'

  return (
    <Html
      position={[0, offsetY, 0]}
      center
      distanceFactor={1.5}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="
          w-48 rounded-lg shadow-2xl border border-white/10
          bg-gray-900/95 backdrop-blur-sm text-white
          px-3 py-2.5 text-sm
          select-none
        "
        role="tooltip"
        aria-label={`${book.title} by ${book.author}`}
      >
        {/* Title */}
        <p className="font-semibold leading-tight line-clamp-2 text-white">
          {book.title}
        </p>

        {/* Author */}
        <p className="text-gray-400 text-xs mt-0.5 truncate">{book.author}</p>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-xs">Progress</span>
            <span className="text-xs font-medium">{book.percentRead}%</span>
          </div>
          <div
            className="h-1.5 bg-gray-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={book.percentRead}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${book.percentRead}% read`}
          >
            <div
              className={`h-full rounded-full transition-all ${progressColor}`}
              style={{ width: progressBarWidth }}
            />
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-2 flex justify-end">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </Html>
  )
})

export default BookTooltip
