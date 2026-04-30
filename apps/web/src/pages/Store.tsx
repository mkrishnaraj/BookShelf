import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '../lib/api'
import { useUserStore } from '../stores/userStore'
import ListingCard, { type Listing } from '../components/marketplace/ListingCard'
import CreateListingModal from '../components/marketplace/CreateListingModal'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'

type Condition = 'ALL' | 'NEW' | 'LIKE_NEW' | 'GOOD' | 'ACCEPTABLE'

interface ListingsResponse {
  data: Listing[]
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-muted bg-ink-light overflow-hidden animate-pulse">
      <div className="h-44 bg-ink-muted/30" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  )
}

export default function Store() {
  const api = useApi()
  const plan = useUserStore((s) => s.plan)
  const [condition, setCondition] = useState<Condition>('ALL')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const canList = plan !== 'FREE'

  const { data, isLoading, error } = useQuery<Listing[]>({
    queryKey: ['marketplace-listings', condition, minPrice, maxPrice],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (condition !== 'ALL') params.condition = condition
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      const res = await api.get<ListingsResponse>('/v1/marketplace/listings', { params })
      return res.data.data
    },
  })

  const conditions: { value: Condition; label: string }[] = [
    { value: 'ALL', label: 'All conditions' },
    { value: 'NEW', label: 'New' },
    { value: 'LIKE_NEW', label: 'Like new' },
    { value: 'GOOD', label: 'Good' },
    { value: 'ACCEPTABLE', label: 'Acceptable' },
  ]

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Marketplace</h1>
          <p className="mt-1 text-sm text-slate-400">Buy and sell books with other readers.</p>
        </div>
        {canList ? (
          <Button onClick={() => setCreateOpen(true)}>
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            List a book
          </Button>
        ) : (
          <Button variant="secondary" disabled title="Upgrade to Reader+ to list books">
            List a book (Reader+)
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl border border-ink-muted bg-ink-light">
        <div className="flex-1 min-w-40">
          <label htmlFor="filter-condition" className="block text-xs text-slate-400 mb-1">Condition</label>
          <select
            id="filter-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
          >
            {conditions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label htmlFor="filter-min" className="block text-xs text-slate-400 mb-1">Min price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              id="filter-min"
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg bg-ink border border-ink-muted pl-7 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>
        </div>
        <div className="w-28">
          <label htmlFor="filter-max" className="block text-xs text-slate-400 mb-1">Max price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              id="filter-max"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="w-full rounded-lg bg-ink border border-ink-muted pl-7 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>
        </div>
      </div>

      {/* Listings grid */}
      {error ? (
        <p className="text-sm text-accent">Failed to load listings. Please try again.</p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {data.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onBuy={(l) => {
                // TODO: Stripe checkout for single listing
                console.log('Buy listing', l.id)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="rounded-2xl bg-shelf-500/10 p-5">
            <svg
              aria-hidden="true"
              className="h-12 w-12 text-shelf-500 mx-auto"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No listings found. Be the first to list a book!</p>
        </div>
      )}

      <CreateListingModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
