import { useState } from 'react'
import { useShelves } from '../hooks/useShelves'
import { useUser } from '../hooks/useUser'
import ShelfCard, { ShelfCardSkeleton } from '../components/shelves/ShelfCard'
import CreateShelfModal from '../components/shelves/CreateShelfModal'
import TrialBanner from '../components/billing/TrialBanner'
import Button from '../components/ui/Button'

function EmptyState({ onCreateShelf }: { onCreateShelf: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="rounded-2xl bg-shelf-500/10 p-6">
        <svg
          aria-hidden="true"
          className="h-16 w-16 text-shelf-500 mx-auto"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          viewBox="0 0 24 24"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Your shelves are empty</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm">
          Create your first virtual bookshelf and start adding your books.
        </p>
      </div>
      <Button size="lg" onClick={onCreateShelf}>
        Create your first shelf
      </Button>
    </div>
  )
}

export default function Dashboard() {
  const { shelves, isLoading } = useShelves()
  const { plan } = useUser()
  const [createOpen, setCreateOpen] = useState(false)

  // Trial: simulate 7 days left (real implementation would come from user data)
  const trialDaysLeft: number | null = null

  return (
    <div className="flex flex-col h-full">
      {trialDaysLeft !== null && <TrialBanner daysLeft={trialDaysLeft} />}

      <div className="px-6 py-8 flex-1">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Your Shelves</h1>
            <p className="mt-1 text-sm text-slate-400">Manage and browse all your bookshelves.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Shelf
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <ShelfCardSkeleton key={i} />
            ))}
          </div>
        ) : shelves.length === 0 ? (
          <EmptyState onCreateShelf={() => setCreateOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shelves.map((shelf) => (
              <ShelfCard key={shelf.id} shelf={shelf} />
            ))}
          </div>
        )}
      </div>

      <CreateShelfModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
