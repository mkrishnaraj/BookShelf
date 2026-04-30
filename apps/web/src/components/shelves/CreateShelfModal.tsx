import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useApi } from '../../lib/api'
import { useUserStore } from '../../stores/userStore'
import type { Shelf, ShelfSize, ShelfTheme } from '../../stores/shelfStore'

interface CreateShelfModalProps {
  open: boolean
  onClose: () => void
}

const SIZES: { value: ShelfSize; label: string; capacity: string }[] = [
  { value: 'S', label: 'Small', capacity: '50 books' },
  { value: 'M', label: 'Medium', capacity: '150 books' },
  { value: 'L', label: 'Large', capacity: '300 books' },
  { value: 'XL', label: 'Extra Large', capacity: '500 books' },
]

const THEMES: { value: ShelfTheme; label: string; swatch: string }[] = [
  { value: 'DARK_WOOD', label: 'Dark Wood', swatch: 'bg-amber-900' },
  { value: 'LIGHT_OAK', label: 'Light Oak', swatch: 'bg-amber-300' },
  { value: 'WHITE_MINIMALIST', label: 'Minimal', swatch: 'bg-slate-100' },
  { value: 'VINTAGE', label: 'Vintage', swatch: 'bg-yellow-700' },
]

const FREE_SHELF_LIMIT = 1

export default function CreateShelfModal({ open, onClose }: CreateShelfModalProps) {
  const api = useApi()
  const queryClient = useQueryClient()
  const { plan, usage } = useUserStore()

  const [name, setName] = useState('')
  const [size, setSize] = useState<ShelfSize>('M')
  const [theme, setTheme] = useState<ShelfTheme>('DARK_WOOD')
  const [error, setError] = useState<string | null>(null)

  const atFreeLimit = plan === 'FREE' && (usage.shelvesUsed >= FREE_SHELF_LIMIT)

  const createShelf = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: Shelf }>('/v1/shelves', { name, size, theme })
      return res.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shelves'] })
      setName('')
      setSize('M')
      setTheme('DARK_WOOD')
      setError(null)
      onClose()
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create shelf'
      setError(msg)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Shelf name is required')
      return
    }
    createShelf.mutate()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a new shelf" size="md">
      {atFreeLimit && (
        <div className="mb-4 rounded-lg bg-accent/10 border border-accent/30 px-4 py-3 text-sm text-accent">
          Free plan allows 1 shelf. Upgrade to Reader+ for more shelves.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="shelf-name" className="block text-sm font-medium text-slate-300 mb-1.5">
            Shelf name
          </label>
          <input
            id="shelf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Science Fiction, Bedside Table..."
            maxLength={60}
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          />
        </div>

        {/* Size */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">Size</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSize(s.value)}
                className={clsx(
                  'rounded-lg border px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500',
                  size === s.value
                    ? 'border-shelf-500 bg-shelf-500/10 text-shelf-200'
                    : 'border-ink-muted bg-ink text-slate-400 hover:border-slate-500',
                )}
              >
                <span className="block font-semibold">{s.label}</span>
                <span className="block text-slate-500">{s.capacity}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Theme */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">Theme</legend>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={clsx(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500',
                  theme === t.value
                    ? 'border-shelf-500 bg-shelf-500/10 text-shelf-200'
                    : 'border-ink-muted bg-ink text-slate-400 hover:border-slate-500',
                )}
              >
                <span className={clsx('h-4 w-4 rounded flex-shrink-0', t.swatch)} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createShelf.isPending}
            disabled={atFreeLimit || !name.trim()}
          >
            Create shelf
          </Button>
        </div>
      </form>
    </Modal>
  )
}
