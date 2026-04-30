import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useApi } from '../../lib/api'
import type { Listing } from './ListingCard'

interface CreateListingModalProps {
  open: boolean
  onClose: () => void
}

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD', label: 'Good' },
  { value: 'ACCEPTABLE', label: 'Acceptable' },
]

export default function CreateListingModal({ open, onClose }: CreateListingModalProps) {
  const api = useApi()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [condition, setCondition] = useState('LIKE_NEW')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createListing = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: Listing }>('/v1/marketplace/listings', {
        title,
        author,
        condition,
        price: parseFloat(price),
        description,
      })
      return res.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] })
      void queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] })
      setTitle('')
      setAuthor('')
      setCondition('LIKE_NEW')
      setPrice('')
      setDescription('')
      setError(null)
      onClose()
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) { setError('Enter a valid price'); return }
    createListing.mutate()
  }

  return (
    <Modal open={open} onClose={onClose} title="List a book for sale" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="listing-title" className="block text-sm font-medium text-slate-300 mb-1.5">
            Book title *
          </label>
          <input
            id="listing-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          />
        </div>

        <div>
          <label htmlFor="listing-author" className="block text-sm font-medium text-slate-300 mb-1.5">
            Author
          </label>
          <input
            id="listing-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          />
        </div>

        <div>
          <label htmlFor="listing-condition" className="block text-sm font-medium text-slate-300 mb-1.5">
            Condition
          </label>
          <select
            id="listing-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="listing-price" className="block text-sm font-medium text-slate-300 mb-1.5">
            Price (USD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              id="listing-price"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted pl-7 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="listing-description" className="block text-sm font-medium text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            id="listing-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Condition notes, edition info..."
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-shelf-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createListing.isPending}>
            Create listing
          </Button>
        </div>
      </form>
    </Modal>
  )
}
