import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BookshelfCanvas, type BookData } from '../components/bookshelf'
import BookDetailPanel from '../components/books/BookDetailPanel'
import BookSearchModal from '../components/books/BookSearchModal'
import UniversalImport from '../components/import/UniversalImport'
import CameraCapture from '../components/camera/CameraCapture'
import { useBooks } from '../hooks/useBooks'
import { useShelfStore } from '../stores/shelfStore'
import type { Book } from '../stores/shelfStore'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

type SortKey = 'title' | 'author' | 'genre' | 'date-added' | 'rating' | 'progress'
type ShelfTheme = 'DARK_WOOD' | 'LIGHT_OAK' | 'WHITE_MINIMALIST' | 'VINTAGE'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'title', label: 'Title A-Z' },
  { value: 'author', label: 'Author A-Z' },
  { value: 'genre', label: 'Genre' },
  { value: 'date-added', label: 'Date Added' },
  { value: 'rating', label: 'Rating' },
  { value: 'progress', label: '% Read' },
]

const THEMES: { value: ShelfTheme; label: string; swatch: string }[] = [
  { value: 'DARK_WOOD', label: 'Dark Wood', swatch: 'bg-amber-900' },
  { value: 'LIGHT_OAK', label: 'Light Oak', swatch: 'bg-amber-300' },
  { value: 'WHITE_MINIMALIST', label: 'Minimal', swatch: 'bg-slate-100' },
  { value: 'VINTAGE', label: 'Vintage', swatch: 'bg-yellow-700' },
]

function sortBooks(books: Book[], key: SortKey): Book[] {
  return [...books].sort((a, b) => {
    switch (key) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'author':
        return a.author.localeCompare(b.author)
      case 'genre':
        return (a.genre ?? '').localeCompare(b.genre ?? '')
      case 'date-added':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0)
      case 'progress':
        return b.progressPercent - a.progressPercent
      default:
        return 0
    }
  })
}

function bookToBookData(book: Book): BookData {
  const spineWidthMm = book.pageCount
    ? Math.min(50, Math.max(5, (book.pageCount / 300) * 35))
    : 20
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    spineWidthMm,
    heightMm: 203 * (0.95 + Math.random() * 0.1),
    depthMm: 130,
    spineColor: book.dominantColor ?? '#8B5E3C',
    ...(book.coverUrl ? { coverUrl: book.coverUrl } : {}),
    percentRead: book.progressPercent,
    status: book.status,
  }
}

type AddMode = 'search' | 'import' | 'camera-cover' | 'camera-shelf' | null

export default function ShelfView() {
  const { id: shelfId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { books, isLoading, error } = useBooks(shelfId)
  const shelf = useShelfStore((s) => s.shelves.find((sh) => sh.id === shelfId))

  const [sort, setSort] = useState<SortKey>('date-added')
  const [theme, setTheme] = useState<ShelfTheme>(shelf?.theme ?? 'DARK_WOOD')
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [addMode, setAddMode] = useState<AddMode>(null)
  const [addDropdownOpen, setAddDropdownOpen] = useState(false)

  const selectedBook = books.find((b) => b.id === selectedBookId) ?? null
  const sortedBooks = sortBooks(books, sort)
  const bookData: BookData[] = sortedBooks.map(bookToBookData)

  const handleBookSelect = useCallback((id: string) => {
    setSelectedBookId((prev) => (prev === id ? null : id))
    setSidebarOpen(true)
  }, [])

  if (!shelfId) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* 3D Canvas — fills remaining space */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-ink">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-shelf-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center bg-ink text-slate-400">
            <p>Failed to load shelf. <button onClick={() => window.location.reload()} className="underline">Retry</button></p>
          </div>
        ) : (
          <BookshelfCanvas
            shelfId={shelfId}
            books={bookData}
            theme={theme}
            onBookSelect={handleBookSelect}
          />
        )}

        {/* Mobile FAB */}
        <div className="absolute bottom-4 right-4 md:hidden">
          <button
            onClick={() => setAddDropdownOpen((o) => !o)}
            aria-label="Add books"
            className="h-14 w-14 rounded-full bg-shelf-500 text-shelf-50 shadow-lg flex items-center justify-center text-2xl hover:bg-shelf-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-300"
          >
            <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div
        className={clsx(
          'flex-shrink-0 border-l border-ink-muted bg-ink-light flex flex-col transition-all duration-200',
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
          'hidden md:flex',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-muted">
          <h2 className="text-sm font-semibold text-slate-200 truncate">
            {shelf?.name ?? 'Shelf'}
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse panel"
            className="text-slate-400 hover:text-slate-200 p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-shelf-500"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {selectedBook ? (
            <BookDetailPanel
              book={selectedBook}
              onClose={() => setSelectedBookId(null)}
            />
          ) : (
            <>
              {/* Sort */}
              <div>
                <label htmlFor="shelf-sort" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Sort by
                </label>
                <select
                  id="shelf-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Shelf theme</p>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTheme(t.value)}
                      className={clsx(
                        'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-shelf-500',
                        theme === t.value
                          ? 'border-shelf-500 bg-shelf-500/10 text-shelf-200'
                          : 'border-ink-muted bg-ink text-slate-400 hover:border-slate-500',
                      )}
                    >
                      <span className={clsx('h-3 w-3 rounded flex-shrink-0', t.swatch)} aria-hidden="true" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add books */}
              <div className="relative">
                <Button
                  onClick={() => setAddDropdownOpen((o) => !o)}
                  className="w-full"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add books
                </Button>

                {addDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-ink-muted bg-ink-light shadow-lg z-20 overflow-hidden">
                    {[
                      { label: 'Search for a book', action: () => { setAddMode('search'); setAddDropdownOpen(false) } },
                      { label: 'Import from your libraries', action: () => { setAddMode('import'); setAddDropdownOpen(false) } },
                      { label: 'Scan a book cover', action: () => { setAddMode('camera-cover'); setAddDropdownOpen(false) } },
                      { label: 'Scan my physical shelf', action: () => { setAddMode('camera-shelf'); setAddDropdownOpen(false) } },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-ink hover:text-slate-100 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Book count */}
              <p className="text-xs text-slate-500 text-center">
                {books.length} book{books.length !== 1 ? 's' : ''} on this shelf
              </p>
            </>
          )}
        </div>
      </div>

      {/* Collapsed sidebar toggle (desktop) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Expand panel"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 h-10 w-6 items-center justify-center rounded-l-lg bg-ink-light border border-r-0 border-ink-muted text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Modals */}
      <BookSearchModal
        open={addMode === 'search'}
        onClose={() => setAddMode(null)}
        shelfId={shelfId}
      />

      <UniversalImport
        open={addMode === 'import'}
        onClose={() => setAddMode(null)}
        defaultShelfId={shelfId}
      />

      <Modal
        open={addMode === 'camera-cover' || addMode === 'camera-shelf'}
        onClose={() => setAddMode(null)}
        title={addMode === 'camera-shelf' ? 'Scan your shelf' : 'Scan a book cover'}
        size="md"
      >
        {(addMode === 'camera-cover' || addMode === 'camera-shelf') && (
          <CameraCapture
            mode={addMode === 'camera-shelf' ? 'shelf' : 'cover'}
            shelfId={shelfId}
            onComplete={() => setAddMode(null)}
            onCancel={() => setAddMode(null)}
          />
        )}
      </Modal>
    </div>
  )
}
