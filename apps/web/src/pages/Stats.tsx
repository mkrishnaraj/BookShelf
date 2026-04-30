import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import clsx from 'clsx'
import { useApi } from '../lib/api'
import Skeleton from '../components/ui/Skeleton'

type Period = 'week' | 'month' | 'year'

interface StatsData {
  booksRead: number
  pagesRead: number
  avgRating: number
  currentStreak: number
  longestStreak: number
  chart: { label: string; booksRead: number; pagesRead: number }[]
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-ink-muted bg-ink-light p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1.5 text-3xl font-bold text-slate-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-muted bg-ink-light p-5">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export default function Stats() {
  const api = useApi()
  const [period, setPeriod] = useState<Period>('month')

  const { data, isLoading, error } = useQuery<StatsData>({
    queryKey: ['stats', period],
    queryFn: async () => {
      const res = await api.get<{ data: StatsData }>('/v1/stats', { params: { period } })
      return res.data.data
    },
  })

  const periods: { value: Period; label: string }[] = [
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'year', label: 'This year' },
  ]

  return (
    <div className="px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Reading Stats</h1>
        <p className="mt-1 text-sm text-slate-400">Weekly, monthly, and yearly reading insights.</p>
      </div>

      {/* Period toggle */}
      <div
        role="group"
        aria-label="Select time period"
        className="flex gap-1 rounded-lg bg-ink p-1 border border-ink-muted mb-8 w-fit"
      >
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={clsx(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500',
              period === p.value
                ? 'bg-shelf-500 text-shelf-50'
                : 'text-slate-400 hover:text-slate-200',
            )}
            aria-pressed={period === p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      {error ? (
        <p className="text-sm text-accent mb-8">Failed to load stats.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : data ? (
            <>
              <StatCard label="Books Read" value={data.booksRead} />
              <StatCard
                label="Pages Read"
                value={data.pagesRead.toLocaleString()}
              />
              <StatCard
                label="Avg Rating"
                value={data.avgRating > 0 ? data.avgRating.toFixed(1) : '—'}
                sub="out of 5"
              />
              <StatCard
                label="Current Streak"
                value={`${data.currentStreak}d`}
                sub={`Best: ${data.longestStreak} days`}
              />
            </>
          ) : null}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl border border-ink-muted bg-ink-light p-5 mb-8">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">
          Books read per {period === 'week' ? 'day' : period === 'month' ? 'week' : 'month'}
        </h2>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-shelf-500 border-t-transparent" />
          </div>
        ) : data?.chart && data.chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data.chart}
              aria-label={`Books read per ${period === 'week' ? 'day' : period === 'month' ? 'week' : 'month'}`}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16213e',
                  border: '1px solid #4a5568',
                  borderRadius: '0.5rem',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(139, 94, 60, 0.1)' }}
              />
              <Bar dataKey="booksRead" name="Books read" fill="#8B5E3C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            No reading data for this period yet.
          </div>
        )}
      </div>

      {/* Streak section */}
      {data && (
        <div className="rounded-xl border border-ink-muted bg-ink-light p-5">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-2xl"
              aria-hidden="true"
            >
              {/* flame SVG */}
              <svg className="h-7 w-7 text-orange-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C9.284 2 7 4.284 7 7c0 2.03 1.167 3.788 2.854 4.67C9.309 12.72 9 13.827 9 15c0 1.657.67 3.157 1.757 4.243A5.99 5.99 0 0012 20a5.99 5.99 0 001.243-.757C14.33 18.157 15 16.657 15 15c0-1.173-.309-2.28-.854-3.33C15.833 10.788 17 9.03 17 7c0-2.716-2.284-5-5-5z"/>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{data.currentStreak} day streak</p>
              <p className="text-sm text-slate-400">
                Best: {data.longestStreak} days
              </p>
            </div>
          </div>
          {data.currentStreak > 0 && (
            <p className="mt-3 text-sm text-slate-400">
              Keep it up! Log reading today to extend your streak.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
