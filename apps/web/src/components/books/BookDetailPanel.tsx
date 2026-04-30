import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import Button from '../ui/Button'
import StarRating from '../ui/StarRating'
import { useApi } from '../../lib/api'
import type { Book, ReadingStatus } from '../../stores/shelfStore'

interface BookDetailPanelProps {
  book: Book
  onClose: () => void
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'WANT_TO_READ', label: 'Want to Read' },
  { value: 'READING', label: 'Currently Reading' },
  { value: 'READ', label: 'Read' },
  { value: 'DID_NOT_FINISH', label: 'Did Not Finish' },
]

export default function BookDetailPanel({ book, onClose }: BookDetailPanelProps) {
  const api = useApi()
  const queryClient = useQueryClient()

  const [progress, setProgress] = useState(book.progressPercent)
  const [status, setStatus] = useState<ReadingStatus>(book.status as ReadingStatus)
  const [rating, setRating] = useState(book.rating ?? 0)
  const [notes, setNotes] = useState(book.description ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProgress(book.progressPercent)
    setStatus(book.status as ReadingStatus)
    setRating(book.rating ?? 0)
    setNotes(book.description ?? '')
  }, [book])

  const saveProgress = useMutation({
    mutationFn: async () => {
      const res = await api.patch<{ data: Book }>(
        `/v1/shelves/${book.shelfId}/books/${book.id}/progress`,
        { progressPercent: progress, status, rating, description: notes },
      )
      return res.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books', book.shelfId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-100 leading-tight">{book.title}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{book.author}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="flex-shrink-0 text-slate-400 hover:text-slate-200 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cover */}
      {book.coverUrl && (
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          className="w-full max-w-[120px] mx-auto rounded-lg object-cover mb-4 shadow-lg"
        />
      )}

      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Progress slider */}
        <div>
          <label htmlFor="progress-slider" className="block text-xs font-medium text-slate-400 mb-1.5">
            Progress — {progress}%
          </label>
          <input
            id="progress-slider"
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-shelf-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="book-status" className="block text-xs font-medium text-slate-400 mb-1.5">
            Status
          </label>
          <select
            id="book-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus)}
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">Rating</p>
          <StarRating value={rating} onChange={setRating} size="md" />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="book-notes" className="block text-xs font-medium text-slate-400 mb-1.5">
            Notes
          </label>
          <textarea
            id="book-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Your thoughts..."
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-shelf-500 resize-none"
          />
        </div>

        {book.pageCount && (
          <p className="text-xs text-slate-500">{book.pageCount} pages</p>
        )}
      </div>

      {/* Save */}
      <div className="pt-4 border-t border-ink-muted mt-4">
        <Button
          onClick={() => saveProgress.mutate()}
          loading={saveProgress.isPending}
          className="w-full"
        >
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
