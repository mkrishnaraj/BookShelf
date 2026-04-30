import { useState } from 'react'
import Button from '../ui/Button'
import type { Shelf } from '../../stores/shelfStore'

export interface ParsedBook {
  id: string
  title: string
  author: string
  source?: string
  pageCount?: number
}

interface ImportPreviewProps {
  parsedBooks: ParsedBook[]
  warnings: string[]
  sourceName: string
  shelves: Shelf[]
  defaultShelfId?: string | undefined
  onConfirm: (selectedIds: string[], shelfId: string) => void
  onBack: () => void
}

export default function ImportPreview({
  parsedBooks,
  warnings,
  sourceName,
  shelves,
  defaultShelfId,
  onConfirm,
  onBack,
}: ImportPreviewProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(parsedBooks.map((b) => b.id)),
  )
  const [shelfId, setShelfId] = useState(defaultShelfId ?? shelves[0]?.id ?? '')

  function toggleAll() {
    if (selected.size === parsedBooks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(parsedBooks.map((b) => b.id)))
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

  const allSelected = selected.size === parsedBooks.length
  const noneSelected = selected.size === 0

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Summary badge */}
      <div className="rounded-lg bg-shelf-500/10 border border-shelf-500/30 px-4 py-3">
        <p className="text-sm text-shelf-300">
          Detected: {sourceName} — <strong>{parsedBooks.length} books found</strong>
        </p>
      </div>

      {/* Warnings */}
      {warnings.map((w) => (
        <div key={w} className="rounded-lg bg-yellow-600/10 border border-yellow-600/30 px-4 py-3 text-sm text-yellow-400">
          {w}
        </div>
      ))}

      {/* Shelf selector */}
      {shelves.length > 0 && (
        <div>
          <label htmlFor="import-shelf" className="block text-sm font-medium text-slate-300 mb-1.5">
            Import to shelf
          </label>
          <select
            id="import-shelf"
            value={shelfId}
            onChange={(e) => setShelfId(e.target.value)}
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          >
            {shelves.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Select all / Deselect all */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {selected.size} of {parsedBooks.length} selected
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm text-shelf-300 hover:text-shelf-200"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Book list */}
      <ul className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border border-ink-muted p-2" role="list">
        {parsedBooks.map((book) => (
          <li key={book.id}>
            <label className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-ink cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(book.id)}
                onChange={() => toggleBook(book.id)}
                className="h-4 w-4 rounded accent-shelf-500"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200 truncate">{book.title}</p>
                <p className="text-xs text-slate-500 truncate">{book.author}</p>
              </div>
              {book.source && (
                <span className="flex-shrink-0 rounded-full bg-ink-muted/40 px-2 py-0.5 text-xs text-slate-400">
                  {book.source}
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onConfirm(Array.from(selected), shelfId)}
        disabled={noneSelected || !shelfId}
        className="w-full"
      >
        Import selected ({selected.size})
      </Button>
    </div>
  )
}
