import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import Button from '../ui/Button'
import { useApi } from '../../lib/api'
import type { Book } from '../../stores/shelfStore'

interface ScannedBook {
  title: string
  author: string
  coverUrl?: string
  pageCount?: number
  isbn?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface ShelfScanReviewProps {
  books: ScannedBook[]
  unreadableCount: number
  shelfId: string
  onConfirm: (books: Partial<Book>[]) => void
  onRetry: () => void
}

const CONFIDENCE_COLORS = {
  HIGH: 'bg-green-600/20 text-green-400',
  MEDIUM: 'bg-yellow-600/20 text-yellow-400',
  LOW: 'bg-red-600/20 text-red-400',
}

interface EditableBook extends ScannedBook {
  id: string
  editing: boolean
}

export default function ShelfScanReview({
  books: initialBooks,
  unreadableCount,
  shelfId,
  onConfirm,
  onRetry,
}: ShelfScanReviewProps) {
  const api = useApi()
  const queryClient = useQueryClient()

  const [bookList, setBookList] = useState<EditableBook[]>(
    initialBooks.map((b, i) => ({ ...b, id: String(i), editing: false })),
  )
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialBooks.map((_, i) => String(i))),
  )

  function toggleAll() {
    if (selected.size === bookList.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(bookList.map((b) => b.id)))
    }
  }

  function toggleBook(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function startEdit(id: string) {
    setBookList((prev) => prev.map((b) => (b.id === id ? { ...b, editing: true } : b)))
  }

  function saveEdit(id: string, title: string, author: string) {
    setBookList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, title, author, editing: false } : b)),
    )
  }

  const bulkAdd = useMutation({
    mutationFn: async () => {
      const selectedBooks = bookList.filter((b) => selected.has(b.id))
      const results: Book[] = []
      for (const book of selectedBooks) {
        const res = await api.post<{ data: Book }>(`/v1/shelves/${shelfId}/books`, {
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          pageCount: book.pageCount,
          isbn: book.isbn,
          status: 'WANT_TO_READ',
          progressPercent: 0,
          source: 'CAMERA_SCAN',
        })
        results.push(res.data.data)
      }
      return results
    },
    onSuccess: (addedBooks) => {
      void queryClient.invalidateQueries({ queryKey: ['books', shelfId] })
      onConfirm(addedBooks)
    },
  })

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg bg-shelf-500/10 border border-shelf-500/30 px-4 py-3">
        <p className="text-sm text-shelf-300">
          Found <strong>{bookList.length} books</strong>
          {unreadableCount > 0 && (
            <> — <span className="text-yellow-400">{unreadableCount} spines unreadable</span></>
          )}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{selected.size} of {bookList.length} selected</p>
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm text-shelf-300 hover:text-shelf-200"
        >
          {selected.size === bookList.length ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Book list */}
      <ul className="max-h-72 overflow-y-auto space-y-1.5 rounded-lg border border-ink-muted p-2" role="list">
        {bookList.map((book) => (
          <li key={book.id}>
            {book.editing ? (
              <EditRow book={book} onSave={(t, a) => saveEdit(book.id, t, a)} />
            ) : (
              <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-ink">
                <input
                  type="checkbox"
                  checked={selected.has(book.id)}
                  onChange={() => toggleBook(book.id)}
                  className="h-4 w-4 rounded accent-shelf-500 flex-shrink-0"
                  aria-label={`Select ${book.title}`}
                />
                {book.coverUrl && (
                  <img src={book.coverUrl} alt="" className="h-10 w-7 rounded object-cover flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 truncate">{book.title}</p>
                  <p className="text-xs text-slate-500 truncate">{book.author}</p>
                </div>
                <span
                  className={clsx(
                    'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    CONFIDENCE_COLORS[book.confidence],
                  )}
                >
                  {book.confidence.toLowerCase()}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(book.id)}
                  className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={`Edit ${book.title}`}
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {bulkAdd.isPending && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Adding books to shelf...</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-ink-muted/40 overflow-hidden">
            <div className="h-full rounded-full bg-shelf-500 animate-pulse w-1/2" />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onRetry} className="flex-1">
          Retry scan
        </Button>
        <Button
          onClick={() => bulkAdd.mutate()}
          loading={bulkAdd.isPending}
          disabled={selected.size === 0}
          className="flex-1"
        >
          Add selected ({selected.size})
        </Button>
      </div>
    </div>
  )
}

function EditRow({
  book,
  onSave,
}: {
  book: EditableBook
  onSave: (title: string, author: string) => void
}) {
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)

  return (
    <div className="rounded-md border border-shelf-500/40 bg-ink px-2 py-2 space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded bg-ink-light border border-ink-muted px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-shelf-500"
        placeholder="Title"
        aria-label="Edit title"
      />
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="w-full rounded bg-ink-light border border-ink-muted px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-shelf-500"
        placeholder="Author"
        aria-label="Edit author"
      />
      <button
        type="button"
        onClick={() => onSave(title, author)}
        className="text-xs text-shelf-300 hover:text-shelf-200"
      >
        Save
      </button>
    </div>
  )
}
