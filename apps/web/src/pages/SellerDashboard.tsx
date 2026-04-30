import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useApi } from '../lib/api'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'

interface SellerDashboardData {
  connected: boolean
  stripeOnboardingUrl?: string
  totalEarnings: number
  pendingPayout: number
  activeListings: number
  completedOrders: number
  recentOrders: {
    id: string
    bookTitle: string
    buyerName: string
    amount: number
    status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    createdAt: string
  }[]
}

const ORDER_STATUS_CONFIG = {
  PENDING: { label: 'Pending', className: 'bg-yellow-600/20 text-yellow-400' },
  SHIPPED: { label: 'Shipped', className: 'bg-shelf-500/20 text-shelf-300' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-600/20 text-green-400' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-600/20 text-red-400' },
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-ink-muted bg-ink-light p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function SellerDashboard() {
  const api = useApi()

  const { data, isLoading, error } = useQuery<SellerDashboardData>({
    queryKey: ['seller-dashboard'],
    queryFn: async () => {
      const res = await api.get<{ data: SellerDashboardData }>('/v1/seller/dashboard')
      return res.data.data
    },
  })

  return (
    <div className="px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Seller Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your listings, orders, and payouts.</p>
      </div>

      {error && (
        <p className="text-sm text-accent mb-6">Failed to load seller data.</p>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-ink-muted bg-ink-light p-5 animate-pulse">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Stripe onboarding */}
          {!data.connected && (
            <div className="rounded-xl border border-shelf-500/40 bg-shelf-500/5 p-6">
              <h2 className="text-base font-semibold text-shelf-200 mb-2">Connect your bank account</h2>
              <p className="text-sm text-slate-400 mb-4">
                To receive payouts from book sales, connect your Stripe account. Weekly payouts are
                sent automatically after the platform fee.
              </p>
              <Button
                onClick={async () => {
                  if (data.stripeOnboardingUrl) {
                    window.location.href = data.stripeOnboardingUrl
                  } else {
                    try {
                      const res = await api.post<{ data: { url: string } }>('/v1/seller/connect')
                      window.location.href = res.data.data.url
                    } catch { /* ignore */ }
                  }
                }}
              >
                Connect with Stripe
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Total Earnings" value={`$${data.totalEarnings.toFixed(2)}`} />
            <StatBox label="Pending Payout" value={`$${data.pendingPayout.toFixed(2)}`} sub="Next weekly payout" />
            <StatBox label="Active Listings" value={String(data.activeListings)} />
            <StatBox label="Completed Orders" value={String(data.completedOrders)} />
          </div>

          {/* Recent orders */}
          <div>
            <h2 className="text-base font-semibold text-slate-100 mb-4">Recent Orders</h2>

            {data.recentOrders.length === 0 ? (
              <div className="rounded-xl border border-ink-muted bg-ink-light px-6 py-10 text-center">
                <p className="text-sm text-slate-500">No orders yet. List a book to get started!</p>
              </div>
            ) : (
              <div className="rounded-xl border border-ink-muted overflow-hidden">
                <table className="w-full text-sm" aria-label="Recent orders">
                  <thead>
                    <tr className="border-b border-ink-muted bg-ink">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Book</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide hidden sm:table-cell">Buyer</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Amount</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-muted bg-ink-light">
                    {data.recentOrders.map((order) => {
                      const status = ORDER_STATUS_CONFIG[order.status]
                      return (
                        <tr key={order.id}>
                          <td className="px-4 py-3 text-slate-200 truncate max-w-[180px]">{order.bookTitle}</td>
                          <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{order.buyerName}</td>
                          <td className="px-4 py-3 text-slate-200 font-medium">${order.amount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                                status.className,
                              )}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
