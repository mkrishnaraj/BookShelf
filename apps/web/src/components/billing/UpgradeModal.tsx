import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import PricingTable from './PricingTable'
import { useApi } from '../../lib/api'
import { useUserStore } from '../../stores/userStore'
import type { Plan } from '../../stores/shelfStore'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason?: string
}

export default function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const api = useApi()
  const plan = useUserStore((s) => s.plan)
  const [annual, setAnnual] = useState(false)

  const checkout = useMutation({
    mutationFn: async (targetPlan: Plan) => {
      const res = await api.post<{ data: { url: string } }>('/v1/billing/checkout', {
        plan: targetPlan,
        annual,
      })
      return res.data.data.url
    },
    onSuccess: (url) => {
      window.location.href = url
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Upgrade your plan" size="xl">
      {reason && (
        <div className="mb-5 rounded-lg bg-accent/10 border border-accent/30 px-4 py-3 text-sm text-accent">
          {reason}
        </div>
      )}

      {/* Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={annual ? 'text-slate-400' : 'text-slate-200'} id="billing-monthly">Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-labelledby="billing-monthly billing-annual"
          onClick={() => setAnnual((a) => !a)}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-ink-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500 data-[checked]:bg-shelf-500"
          data-checked={annual ? '' : undefined}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            style={{ transform: annual ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
          />
        </button>
        <span id="billing-annual" className={annual ? 'text-slate-200' : 'text-slate-400'}>
          Annual <span className="text-green-400 text-xs font-semibold ml-1">Save 17%</span>
        </span>
      </div>

      <PricingTable
        annual={annual}
        currentPlan={plan}
        onSelectPlan={(targetPlan) => {
          if (targetPlan === 'FREE' || targetPlan === plan) return
          checkout.mutate(targetPlan)
        }}
      />

      {checkout.isPending && (
        <p className="mt-4 text-center text-sm text-slate-400">Redirecting to Stripe...</p>
      )}
    </Modal>
  )
}
