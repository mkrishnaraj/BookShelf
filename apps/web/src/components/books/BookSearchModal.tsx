import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import { useApi } from '../../lib/api'
import type { Book } from '../../stores/shelfStore'

interface GoogleBook {
  id: string
  title: string
  author: string
  coverUrl?: string
  pageCount?: number
  publishedYear?: number
  isbn?: string
  description?: string
}

interface BookSearchModalProps {
  open: boolean
  onClose: () => void
  shelfId: string
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useState(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  })
  // Simpler approach with useCallback
  return debounced
}

function useBookSearch(query: string) {
  const api = useApi()
  return useQuery<GoogleBook[]>({
    queryKey: ['book-search', query],
    queryFn: async () => {
      const res = await api.get<{ data: GoogleBook[] }>('/v1/books/search', { params: { q: query } })
      return res.data.data
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  })
}

export default function BookSearchModal({ open, onClose, shelfId }: BookSearchModalProps) {
  const api = useApi()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null)

  // Manual form state
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pageCount, setPageCount] = useState('')

  const { data: results, isLoading } = useBookSearch(debouncedQuery)

  // Debounce input
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    const timer = setTimeout(() => setDebouncedQuery(value), 400)
    return () => clearTimeout(timer)
  }, [])

  const addBook = useMutation({
    mutationFn: async (payload: Partial<Book>) => {
      const res = await api.post<{ data: Book }>(`/v1/shelves/${shelfId}/books`, payload)
      return res.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books', shelfId] })
      onClose()
      setQuery('')
      setDebouncedQuery('')
      setSelectedBook(null)
      setTitle('')
      setAuthor('')
      setPageCount('')
      setManualMode(false)
    },
  })

  function handleSelectResult(book: GoogleBook) {
    setSelectedBook(book)
    setTitle(book.title)
    setAuthor(book.author)
    setPageCount(String(book.pageCount ?? ''))
    setManualMode(true)
  }

  function handleAddManual(e: React.FormEvent) {
    e.preventDefault()
    addBook.mutate({
      shelfId,
      title,
      author,
      pageCount: pageCount ? Number(pageCount) : undefined,
      status: 'WANT_TO_READ',
      progressPercent: 0,
      source: selectedBook ? 'GOOGLE_BOOKS' : 'MANUAL',
      coverUrl: selectedBook?.coverUrl,
      isbn: selectedBook?.isbn,
    } as Partial<Book>)
  }

  function handleClose() {
    setQuery('')
    setDebouncedQuery('')
    setSelectedBook(null)
    setManualMode(false)
    setTitle('')
    setAuthor('')
    setPageCount('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add a book" size="md">
      {!manualMode ? (
        <div className="space-y-4">
          <div className="relative">
            <svg
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by title or author..."
              className="w-full rounded-lg bg-ink border border-ink-muted pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>

          {isLoading && debouncedQuery.length >= 2 && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-ink border border-ink-muted">
                  <Skeleton className="h-16 w-12 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {results && results.length > 0 && (
            <ul className="space-y-2 max-h-72 overflow-y-auto" role="listbox" aria-label="Search results">
              {results.map((book) => (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(book)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-ink border border-ink-muted hover:border-shelf-500/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500"
                  >
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt="" className="h-16 w-12 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-16 w-12 rounded bg-ink-muted flex-shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-100 truncate">{book.title}</p>
                      <p className="text-xs text-slate-400">{book.author}</p>
                      {book.pageCount && (
                        <p className="text-xs text-slate-500 mt-1">{book.pageCount} pages</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {results && results.length === 0 && debouncedQuery.length >= 2 && !isLoading && (
            <p className="text-center text-sm text-slate-400 py-4">
              No books found for &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}

          <p className="text-center">
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="text-sm text-shelf-300 hover:text-shelf-200 underline underline-offset-2"
            >
              Add manually instead
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleAddManual} className="space-y-4">
          {selectedBook && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-ink border border-shelf-500/40">
              {selectedBook.coverUrl && (
                <img src={selectedBook.coverUrl} alt="" className="h-14 w-11 rounded object-cover flex-shrink-0" />
              )}
              <p className="text-sm text-shelf-300">Adding from Google Books</p>
            </div>
          )}

          <div>
            <label htmlFor="add-title" className="block text-sm font-medium text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              id="add-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>

          <div>
            <label htmlFor="add-author" className="block text-sm font-medium text-slate-300 mb-1.5">
              Author
            </label>
            <input
              id="add-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>

          <div>
            <label htmlFor="add-pages" className="block text-sm font-medium text-slate-300 mb-1.5">
              Page count
            </label>
            <input
              id="add-pages"
              type="number"
              min={1}
              max={10000}
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={() => { setManualMode(false); setSelectedBook(null) }}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Back to search
            </button>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={addBook.isPending}>
                Add book
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}
