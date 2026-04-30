import clsx from 'clsx'
import type { Plan } from '../../stores/shelfStore'

interface PlanDef {
  id: Plan
  name: string
  monthlyPrice: string
  annualPrice: string
  annualMonthly: string
  shelves: string
  features: { text: string; included: boolean }[]
  highlight: boolean
  cta: string
}

const PLANS: PlanDef[] = [
  {
    id: 'FREE',
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    annualMonthly: '$0',
    shelves: '1 small shelf (50 books)',
    cta: 'Get started free',
    highlight: false,
    features: [
      { text: '3D bookshelf renderer', included: true },
      { text: 'Manual book entry', included: true },
      { text: 'Basic sorting', included: true },
      { text: 'All book sources', included: false },
      { text: 'Reading stats', included: false },
      { text: 'Shelf themes', included: false },
      { text: 'Notebook', included: false },
      { text: 'CSV export', included: false },
      { text: 'Priority AI enrichment', included: false },
    ],
  },
  {
    id: 'READER',
    name: 'Reader',
    monthlyPrice: '$3.99',
    annualPrice: '$39.99/yr',
    annualMonthly: '$3.33',
    shelves: '3 shelves',
    cta: 'Start Reader',
    highlight: false,
    features: [
      { text: '3D bookshelf renderer', included: true },
      { text: 'Manual book entry', included: true },
      { text: 'Basic sorting', included: true },
      { text: 'All book sources', included: true },
      { text: 'Reading stats', included: true },
      { text: 'Shelf themes', included: false },
      { text: 'Notebook', included: false },
      { text: 'CSV export', included: false },
      { text: 'Priority AI enrichment', included: false },
    ],
  },
  {
    id: 'COLLECTOR',
    name: 'Collector',
    monthlyPrice: '$7.99',
    annualPrice: '$79.99/yr',
    annualMonthly: '$6.67',
    shelves: 'Unlimited shelves',
    cta: 'Start Collector',
    highlight: true,
    features: [
      { text: '3D bookshelf renderer', included: true },
      { text: 'Manual book entry', included: true },
      { text: 'Basic sorting', included: true },
      { text: 'All book sources', included: true },
      { text: 'Reading stats', included: true },
      { text: 'Shelf themes', included: true },
      { text: 'Notebook', included: true },
      { text: 'CSV export', included: true },
      { text: 'Priority AI enrichment', included: false },
    ],
  },
  {
    id: 'BIBLIOPHILE',
    name: 'Bibliophile',
    monthlyPrice: '$12.99',
    annualPrice: '$129.99/yr',
    annualMonthly: '$10.83',
    shelves: 'Unlimited shelves',
    cta: 'Start Bibliophile',
    highlight: false,
    features: [
      { text: '3D bookshelf renderer', included: true },
      { text: 'Manual book entry', included: true },
      { text: 'Basic sorting', included: true },
      { text: 'All book sources', included: true },
      { text: 'Reading stats', included: true },
      { text: 'Shelf themes', included: true },
      { text: 'Notebook', included: true },
      { text: 'CSV export', included: true },
      { text: 'Priority AI enrichment', included: true },
    ],
  },
]

interface PricingTableProps {
  annual: boolean
  onSelectPlan?: (planId: Plan) => void
  currentPlan?: Plan
}

export default function PricingTable({ annual, onSelectPlan, currentPlan }: PricingTableProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id
        return (
          <div
            key={plan.id}
            className={clsx(
              'relative flex flex-col rounded-xl border p-6 gap-4',
              plan.highlight
                ? 'border-shelf-500 bg-shelf-500/5'
                : 'border-ink-muted bg-ink-light',
            )}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-shelf-500 px-3 py-0.5 text-xs font-semibold text-shelf-50 whitespace-nowrap">
                Most popular
              </span>
            )}

            <div>
              <h3 className="font-bold text-slate-100">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-shelf-200">
                  {annual ? plan.annualMonthly : plan.monthlyPrice}
                </span>
                <span className="text-sm text-slate-400 ml-1">/mo</span>
              </div>
              {annual && plan.id !== 'FREE' && (
                <p className="text-xs text-slate-500 mt-0.5">billed as {plan.annualPrice}</p>
              )}
            </div>

            <p className="text-xs text-slate-400">{plan.shelves}</p>

            <ul className="flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f.text} className="flex items-start gap-2 text-xs">
                  {f.included ? (
                    <svg aria-hidden="true" className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" className="h-4 w-4 text-slate-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={f.included ? 'text-slate-300' : 'text-slate-600'}>{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onSelectPlan?.(plan.id)}
              disabled={isCurrent}
              className={clsx(
                'mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500',
                isCurrent
                  ? 'bg-ink-muted/40 text-slate-500 cursor-default'
                  : plan.highlight
                  ? 'bg-shelf-500 text-shelf-50 hover:bg-shelf-600'
                  : 'bg-ink border border-ink-muted text-slate-300 hover:border-shelf-500 hover:text-slate-100',
              )}
            >
              {isCurrent ? 'Current plan' : plan.cta}
            </button>
          </div>
        )
      })}
    </div>
  )
}
