import React, {
  Suspense,
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react'
import type { ShelfTheme } from './types'
import type { BookData } from './types'
import BookshelfScene from './BookshelfScene'

interface BookshelfCanvasProps {
  shelfId: string
  books: BookData[]
  theme: string
  onBookSelect: (id: string) => void
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function ShelfSkeleton() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-900 animate-pulse"
      aria-label="Loading bookshelf..."
      role="status"
    >
      {/* Simulated shelf rows */}
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-end gap-1" style={{ height: 100 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-gray-700"
              style={{
                width: Math.random() * 14 + 10,
                height: 70 + Math.random() * 30,
              }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading bookshelf</span>
    </div>
  )
}

// ─── Error boundary for Three.js failures ────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 gap-3">
          <svg
            className="w-12 h-12 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p className="text-sm">Could not render 3D shelf</p>
          <p className="text-xs text-gray-600">{this.state.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Valid theme guard ────────────────────────────────────────────────────────
const VALID_THEMES: ShelfTheme[] = [
  'DARK_WOOD',
  'LIGHT_OAK',
  'WHITE_MINIMALIST',
  'VINTAGE',
]

function sanitiseTheme(raw: string): ShelfTheme {
  if (VALID_THEMES.includes(raw as ShelfTheme)) return raw as ShelfTheme
  return 'DARK_WOOD'
}

// ─── Main export ─────────────────────────────────────────────────────────────
/**
 * Wrapper around BookshelfScene that handles:
 * - Suspense / skeleton loading state
 * - ResizeObserver keeping the canvas responsive
 * - Error boundary for WebGL failures
 * - Three.js resource disposal on unmount (delegated to R3F's Canvas)
 */
export function BookshelfCanvas({
  shelfId,
  books,
  theme,
  onBookSelect,
}: BookshelfCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>()

  // Keep canvas size in sync with container via ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(el)
    // Initial measurement
    setDimensions({ width: el.clientWidth, height: el.clientHeight })

    return () => observer.disconnect()
  }, [])

  const handleBookSelect = useCallback(
    (id: string) => {
      setSelectedBookId((prev) => (prev === id ? undefined : id))
      onBookSelect(id)
    },
    [onBookSelect],
  )

  const safeTheme = sanitiseTheme(theme)

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden rounded-lg"
      data-shelf-id={shelfId}
      aria-label={`3D bookshelf with ${books.length} book${books.length !== 1 ? 's' : ''}`}
    >
      <CanvasErrorBoundary>
        <Suspense fallback={<ShelfSkeleton />}>
          {dimensions.width > 0 && dimensions.height > 0 && (
            <BookshelfScene
              books={books}
              theme={safeTheme}
              onBookClick={handleBookSelect}
              {...(selectedBookId !== undefined ? { selectedBookId } : {})}
            />
          )}
          {dimensions.width === 0 && <ShelfSkeleton />}
        </Suspense>
      </CanvasErrorBoundary>

      {/* Empty-state overlay (rendered in DOM, not WebGL, for a11y) */}
      {books.length === 0 && dimensions.width > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-400 text-lg font-medium">
              This shelf is empty
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Add your first book to get started
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookshelfCanvas
