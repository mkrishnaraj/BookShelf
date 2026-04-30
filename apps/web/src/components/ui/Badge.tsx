import clsx from 'clsx'
import type { Plan } from '../../stores/shelfStore'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'plan' | 'status' | 'condition' | 'default'
  plan?: Plan
  className?: string
}

const planColors: Record<Plan, string> = {
  FREE: 'bg-ink-muted/60 text-slate-300 border border-ink-muted',
  READER: 'bg-shelf-500/20 text-shelf-300 border border-shelf-500/40',
  COLLECTOR: 'bg-shelf-600/20 text-shelf-200 border border-shelf-600/40',
  BIBLIOPHILE: 'bg-gold/20 text-gold border border-gold/40',
}

const planLabels: Record<Plan, string> = {
  FREE: 'Free',
  READER: 'Reader',
  COLLECTOR: 'Collector',
  BIBLIOPHILE: 'Bibliophile',
}

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        planColors[plan],
      )}
    >
      {planLabels[plan]}
    </span>
  )
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant === 'default' && 'bg-ink-muted/60 text-slate-300 border border-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
