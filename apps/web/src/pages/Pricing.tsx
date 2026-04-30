import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useMutation } from '@tanstack/react-query'
import clsx from 'clsx'
import PricingTable from '../components/billing/PricingTable'
import { useApi } from '../lib/api'
import type { Plan } from '../stores/shelfStore'

const FEATURE_ROWS = [
  { label: '3D bookshelf renderer', FREE: true, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Shelves', FREE: '1 (50 books)', READER: '3 shelves', COLLECTOR: 'Unlimited', BIBLIOPHILE: 'Unlimited' },
  { label: 'Manual book entry', FREE: true, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Goodreads / Kindle / Kobo import', FREE: false, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'EPUB / PDF upload', FREE: false, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Reading stats', FREE: false, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Shelf themes', FREE: false, READER: false, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Notebook & dictionary', FREE: false, READER: false, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'CSV export', FREE: false, READER: false, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Camera scan', FREE: false, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Priority AI enrichment', FREE: false, READER: false, COLLECTOR: false, BIBLIOPHILE: true },
  { label: 'Marketplace (buy & sell)', FREE: false, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
  { label: 'Social shelf sharing', FREE: true, READER: true, COLLECTOR: true, BIBLIOPHILE: true },
]

type CellValue = boolean | string

function FeatureCell({ value }: { value: CellValue }) {
  if (typeof value === 'string') {
    return <td className="px-4 py-3 text-center text-xs text-slate-300">{value}</td>
  }
  return (
    <td className="px-4 py-3 text-center">
      {value ? (
        <svg aria-label="Included" className="h-4 w-4 text-green-400 mx-auto" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <span className="text-slate-600 text-xs">—</span>
      )}
    </td>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-ink-muted rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-slate-200 hover:bg-ink-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-shelf-500"
        aria-expanded={open}
      >
        {q}
        <svg
          aria-hidden="true"
          className={clsx('h-4 w-4 text-slate-400 flex-shrink-0 transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-400 border-t border-ink-muted pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()
  const api = useApi()

  const checkout = useMutation({
    mutationFn: async (plan: Plan) => {
      const res = await api.post<{ data: { url: string } }>('/v1/billing/checkout', { plan, annual })
      return res.data.data.url
    },
    onSuccess: (url) => { window.location.href = url },
  })

  function handleSelectPlan(plan: Plan) {
    if (plan === 'FREE') {
      navigate(isSignedIn ? '/dashboard' : '/sign-up')
      return
    }
    if (!isSignedIn) {
      navigate('/sign-up')
      return
    }
    checkout.mutate(plan)
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-ink-muted max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-shelf-500 flex items-center justify-center">
            <svg aria-hidden="true" className="h-4 w-4 text-shelf-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 2h4v20H4zM10 2h4v20h-4zM16 2h4v20h-4z" />
            </svg>
          </div>
          <span className="font-semibold text-shelf-100">Bookshelf</span>
        </Link>
        {isSignedIn ? (
          <Link to="/dashboard" className="text-sm text-slate-400 hover:text-slate-200">
            Go to app
          </Link>
        ) : (
          <Link to="/sign-in" className="text-sm text-slate-400 hover:text-slate-200">
            Sign in
          </Link>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-100">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
            Start free with a single shelf. Upgrade when your library grows.
            Cancel anytime — no lock-in.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={annual ? 'text-slate-400' : 'font-medium text-slate-200'}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual((a) => !a)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-ink-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink data-[checked]:bg-shelf-500"
              data-checked={annual ? '' : undefined}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{ transform: annual ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
              />
            </button>
            <span className={annual ? 'font-medium text-slate-200' : 'text-slate-400'}>
              Annual{' '}
              <span className="inline-block rounded-full bg-green-600/20 text-green-400 text-xs font-semibold px-2 py-0.5 ml-1">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <PricingTable annual={annual} onSelectPlan={handleSelectPlan} />

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-slate-100 mb-6 text-center">Everything compared</h2>
          <div className="overflow-x-auto rounded-xl border border-ink-muted">
            <table className="w-full text-sm" aria-label="Feature comparison">
              <thead>
                <tr className="border-b border-ink-muted bg-ink">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 w-48">Feature</th>
                  {(['Free', 'Reader', 'Collector', 'Bibliophile'] as const).map((p) => (
                    <th key={p} scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-300">
                      {p}
                      {p === 'Collector' && (
                        <span className="block text-shelf-400 text-xs font-normal">Most popular</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-muted bg-ink-light">
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 text-sm text-slate-300">{row.label}</td>
                    <FeatureCell value={row.FREE} />
                    <FeatureCell value={row.READER} />
                    <FeatureCell value={row.COLLECTOR} />
                    <FeatureCell value={row.BIBLIOPHILE} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-slate-100 mb-6 text-center">Frequently asked questions</h2>
          <div className="space-y-3">
            <FAQ
              q="Can I cancel anytime?"
              a="Yes. Cancel from Settings at any time. You keep access until the end of your billing period."
            />
            <FAQ
              q="What happens to my books if I downgrade?"
              a="Your books and shelves are always safe. On downgrade you can still view them — you just can't add new ones beyond the free limit until you upgrade again."
            />
            <FAQ
              q="Is there a free trial?"
              a="The Free plan is free forever with no credit card required. Paid plans come with a 7-day free trial."
            />
            <FAQ
              q="How does the marketplace commission work?"
              a="We take 15% on Reader, 12% on Collector, and 10% on Bibliophile. This covers Stripe payment processing fees plus platform hosting."
            />
            <FAQ
              q="Can I import from multiple sources?"
              a="Yes — on Reader+ you can import from Kindle, Goodreads, Google Play Books, Kobo, Apple Books, EPUB files, and PDFs all in one place."
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-100">Ready to build your virtual bookshelf?</h2>
          <p className="mt-3 text-slate-400">Join thousands of readers who have already moved their libraries online.</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              to="/sign-up"
              className="rounded-lg bg-shelf-500 px-6 py-3 text-sm font-semibold text-shelf-50 hover:bg-shelf-600 transition-colors"
            >
              Start free
            </Link>
            <Link
              to="/sign-in"
              className="rounded-lg border border-ink-muted px-6 py-3 text-sm font-semibold text-slate-300 hover:border-shelf-500 hover:text-slate-100 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
