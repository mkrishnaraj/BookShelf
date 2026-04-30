import clsx from 'clsx'
import Button from '../ui/Button'

export interface Listing {
  id: string
  title: string
  author: string
  coverUrl?: string
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'ACCEPTABLE'
  price: number
  sellerId: string
  sellerName: string
  description?: string
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  ACCEPTABLE: 'Acceptable',
}

const CONDITION_COLORS: Record<string, string> = {
  NEW: 'bg-green-600/20 text-green-400',
  LIKE_NEW: 'bg-shelf-500/20 text-shelf-300',
  GOOD: 'bg-yellow-600/20 text-yellow-400',
  ACCEPTABLE: 'bg-orange-600/20 text-orange-400',
}

interface ListingCardProps {
  listing: Listing
  onBuy?: (listing: Listing) => void
}

export default function ListingCard({ listing, onBuy }: ListingCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-ink-muted bg-ink-light overflow-hidden hover:border-shelf-500/60 transition-colors">
      {/* Cover */}
      <div className="h-44 bg-ink flex items-center justify-center">
        {listing.coverUrl ? (
          <img
            src={listing.coverUrl}
            alt={`Cover of ${listing.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full flex items-end justify-center pb-3 bg-gradient-to-b from-shelf-700 to-shelf-900"
            aria-hidden="true"
          >
            <p className="text-xs text-shelf-300 px-2 text-center line-clamp-2">{listing.title}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <p className="font-semibold text-sm text-slate-100 line-clamp-2 leading-tight">{listing.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{listing.author}</p>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={clsx(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              CONDITION_COLORS[listing.condition] ?? 'bg-ink-muted/40 text-slate-400',
            )}
          >
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
          <span className="text-base font-bold text-slate-100">${listing.price.toFixed(2)}</span>
        </div>

        <p className="text-xs text-slate-500">Sold by {listing.sellerName}</p>

        <Button
          size="sm"
          onClick={() => onBuy?.(listing)}
          className="w-full mt-auto"
        >
          Buy now
        </Button>
      </div>
    </div>
  )
}
