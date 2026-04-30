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

interface ScanConfirmProps {
  book: ScannedBook
  shelfId: string
  onConfirm: (book: Partial<Book>) => void
  onRetry: () => void
}

const CONFIDENCE_CONFIG = {
  HIGH: { label: 'High confidence', className: 'bg-green-600/20 text-green-400' },
  MEDIUM: { label: 'Please verify', className: 'bg-yellow-600/20 text-yellow-400' },
  LOW: { label: 'Low confidence — edit before adding', className: 'bg-red-600/20 text-red-400' },
}

export default function ScanConfirm({ book, shelfId, onConfirm, onRetry }: ScanConfirmProps) {
  const api = useApi()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)

  const addBook = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: Book }>(`/v1/shelves/${shelfId}/books`, {
        title,
        author,
        coverUrl: book.coverUrl,
        pageCount: book.pageCount,
        isbn: book.isbn,
        status: 'WANT_TO_READ',
        progressPercent: 0,
        source: 'CAMERA_SCAN',
      })
      return res.data.data
    },
    onSuccess: (newBook) => {
      void queryClient.invalidateQueries({ queryKey: ['books', shelfId] })
      onConfirm(newBook)
    },
  })

  const confidence = CONFIDENCE_CONFIG[book.confidence]

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="h-32 w-24 rounded-lg object-cover flex-shrink-0 shadow-lg"
          />
        ) : (
          <div className="h-32 w-24 rounded-lg bg-ink-muted flex-shrink-0" aria-hidden="true" />
        )}

        <div className="flex-1 space-y-3">
          <span
            className={clsx('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', confidence.className)}
          >
            {confidence.label}
          </span>

          <div>
            <label htmlFor="scan-title" className="block text-xs text-slate-400 mb-1">
              Title
            </label>
            <input
              id="scan-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>

          <div>
            <label htmlFor="scan-author" className="block text-xs text-slate-400 mb-1">
              Author
            </label>
            <input
              id="scan-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>

          {book.pageCount && (
            <p className="text-xs text-slate-500">{book.pageCount} pages</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onRetry} className="flex-1">
          Search manually instead
        </Button>
        <Button
          onClick={() => addBook.mutate()}
          loading={addBook.isPending}
          disabled={!title.trim()}
          className="flex-1"
        >
          Add to shelf
        </Button>
      </div>
    </div>
  )
}
