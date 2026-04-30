import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useApi } from '../lib/api'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

interface WishlistItem {
  id: string
  title: string
  author: string
  coverUrl?: string
  priority: Priority
  addedAt: string
  notes?: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  HIGH: { label: 'High priority', className: 'bg-accent/20 text-accent' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-600/20 text-yellow-400' },
  LOW: { label: 'Low', className: 'bg-ink-muted/60 text-slate-400' },
}

function WishlistCard({
  item,
  onDelete,
}: {
  item: WishlistItem
  onDelete: (id: string) => void
}) {
  const priority = PRIORITY_CONFIG[item.priority]
  return (
    <div className="flex items-start gap-4 rounded-xl border border-ink-muted bg-ink-light p-4 hover:border-shelf-500/40 transition-colors">
      {item.coverUrl ? (
        <img
          src={item.coverUrl}
          alt={`Cover of ${item.title}`}
          className="h-20 w-14 rounded object-cover flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="h-20 w-14 rounded bg-ink flex-shrink-0 border border-ink-muted" aria-hidden="true" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-100 truncate">{item.title}</p>
            <p className="text-xs text-slate-400">{item.author}</p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={`Remove ${item.title} from wishlist`}
            className="flex-shrink-0 text-slate-500 hover:text-accent transition-colors p-1 rounded"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span
            className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', priority.className)}
          >
            {priority.label}
          </span>
        </div>

        {item.notes && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.notes}</p>
        )}
      </div>
    </div>
  )
}

function AddWishlistItemForm({
  onAdd,
  loading,
}: {
  onAdd: (title: string, author: string, priority: Priority) => void
  loading: boolean
}) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) {
          onAdd(title, author, priority)
          setTitle('')
          setAuthor('')
          setPriority('MEDIUM')
        }
      }}
      className="rounded-xl border border-shelf-500/30 bg-ink-light p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-200">Add to wishlist</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="wish-title" className="block text-xs text-slate-400 mb-1">Title *</label>
          <input
            id="wish-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          />
        </div>
        <div>
          <label htmlFor="wish-author" className="block text-xs text-slate-400 mb-1">Author</label>
          <input
            id="wish-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          />
        </div>
      </div>
      <div>
        <label htmlFor="wish-priority" className="block text-xs text-slate-400 mb-1">Priority</label>
        <select
          id="wish-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="w-full sm:w-40 rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
        >
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={loading}>
          Add to list
        </Button>
      </div>
    </form>
  )
}

export default function Wishlist() {
  const api = useApi()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: items, isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get<{ data: WishlistItem[] }>('/v1/wishlist')
      return res.data.data
    },
  })

  const addItem = useMutation({
    mutationFn: async ({ title, author, priority }: { title: string; author: string; priority: Priority }) => {
      const res = await api.post<{ data: WishlistItem }>('/v1/wishlist', { title, author, priority })
      return res.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      setShowForm(false)
    },
  })

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/wishlist/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })

  return (
    <div className="px-6 py-8 max-w-2xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Wish List</h1>
          <p className="mt-1 text-sm text-slate-400">Books you want to read next.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add to Wishlist
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AddWishlistItemForm
            onAdd={(title, author, priority) => addItem.mutate({ title, author, priority })}
            loading={addItem.isPending}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-ink-muted bg-ink-light p-4">
              <Skeleton className="h-20 w-14 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onDelete={(id) => deleteItem.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="rounded-2xl bg-shelf-500/10 p-5">
            <svg
              aria-hidden="true"
              className="h-12 w-12 text-shelf-500 mx-auto"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-300 font-medium">Your wishlist is empty</p>
            <p className="text-sm text-slate-500 mt-1">Add books you want to read next.</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            Add your first book
          </Button>
        </div>
      )}
    </div>
  )
}
