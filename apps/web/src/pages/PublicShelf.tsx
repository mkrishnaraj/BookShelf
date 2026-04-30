import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { BookshelfCanvas, type BookData } from '../components/bookshelf'
import Skeleton from '../components/ui/Skeleton'

interface PublicShelfData {
  ownerName: string
  shelfName: string
  theme: string
  books: {
    id: string
    title: string
    author: string
    coverUrl?: string
    pageCount?: number
    dominantColor?: string
    progressPercent: number
    status: string
  }[]
}

function bookToBookData(book: PublicShelfData['books'][number]): BookData {
  const spineWidthMm = book.pageCount
    ? Math.min(50, Math.max(5, (book.pageCount / 300) * 35))
    : 20
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    spineWidthMm,
    heightMm: 203,
    depthMm: 130,
    spineColor: book.dominantColor ?? '#8B5E3C',
    ...(book.coverUrl ? { coverUrl: book.coverUrl } : {}),
    percentRead: book.progressPercent,
    status: book.status,
  }
}

export default function PublicShelf() {
  const { slug } = useParams<{ slug: string }>()

  const { data, isLoading, error } = useQuery<PublicShelfData>({
    queryKey: ['public-shelf', slug],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PublicShelfData }>(`/public/shelf/${slug}`)
      return res.data.data
    },
    enabled: !!slug,
    retry: false,
  })

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Header */}
      <header className="border-b border-ink-muted px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-shelf-500 flex items-center justify-center">
            <svg aria-hidden="true" className="h-4 w-4 text-shelf-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 2h4v20H4zM10 2h4v20h-4zM16 2h4v20h-4z" />
            </svg>
          </div>
          <span className="font-semibold text-shelf-100">Bookshelf</span>
        </Link>

        <Link
          to="/sign-up"
          className="rounded-lg bg-shelf-500 px-4 py-2 text-sm font-semibold text-shelf-50 hover:bg-shelf-600 transition-colors"
        >
          Create your own shelf
        </Link>
      </header>

      {/* Shelf owner info */}
      <div className="px-6 pt-6 pb-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : error ? null : data ? (
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              {data.ownerName}&apos;s {data.shelfName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {data.books.length} book{data.books.length !== 1 ? 's' : ''} on this shelf
            </p>
          </div>
        ) : null}
      </div>

      {/* Canvas */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        {isLoading ? (
          <div className="w-full h-96 rounded-xl bg-ink-light border border-ink-muted animate-pulse flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-shelf-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="w-full h-96 rounded-xl bg-ink-light border border-ink-muted flex flex-col items-center justify-center gap-3 text-slate-400">
            <svg aria-hidden="true" className="h-12 w-12 text-shelf-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <p className="text-slate-300">This shelf could not be found or is private.</p>
            <Link to="/" className="text-sm text-shelf-300 hover:text-shelf-200 underline">
              Return home
            </Link>
          </div>
        ) : data ? (
          <div className="w-full h-[calc(100vh-220px)] min-h-64 rounded-xl overflow-hidden border border-ink-muted">
            <BookshelfCanvas
              shelfId={slug ?? ''}
              books={data.books.map(bookToBookData)}
              theme={data.theme}
              onBookSelect={() => {}}
            />
          </div>
        ) : null}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-ink-muted px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-slate-400">
          Build your own 3D bookshelf to showcase your reading life.
        </p>
        <Link
          to="/sign-up"
          className="rounded-lg bg-shelf-500 px-4 py-2 text-sm font-semibold text-shelf-50 hover:bg-shelf-600 transition-colors flex-shrink-0"
        >
          Follow this reader — it&apos;s free
        </Link>
      </div>
    </div>
  )
}
