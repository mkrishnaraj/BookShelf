import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser as useClerkUser } from '@clerk/clerk-react'
import { useUser } from '../hooks/useUser'
import { useUserStore } from '../stores/userStore'
import { PlanBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useApi } from '../lib/api'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-muted bg-ink-light p-6">
      <h2 className="text-base font-semibold text-slate-100 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <dt className="w-32 flex-shrink-0 text-sm text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-200 bg-ink rounded-lg px-3 py-2 border border-ink-muted flex-1">
        {value}
      </dd>
    </div>
  )
}

export default function Settings() {
  const { user: clerkUser } = useClerkUser()
  const { plan } = useUser()
  const planFromStore = useUserStore((s) => s.plan)
  const api = useApi()

  const [exportLoading, setExportLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const currentPlan = plan ?? planFromStore

  async function handleExport() {
    setExportLoading(true)
    try {
      const res = await api.get('/v1/users/me/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data as BlobPart]))
      const a = document.createElement('a')
      a.href = url
      a.download = `bookshelf-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Silent failure for now
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="px-6 py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your plan, themes, and integrations.</p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <dl className="space-y-3">
          <Field
            label="Display name"
            value={clerkUser?.fullName ?? clerkUser?.firstName ?? 'Unknown'}
          />
          <Field
            label="Email"
            value={clerkUser?.emailAddresses[0]?.emailAddress ?? '—'}
          />
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          To update your name or email, visit{' '}
          <a
            href="https://accounts.clerk.dev/user"
            target="_blank"
            rel="noopener noreferrer"
            className="text-shelf-300 hover:text-shelf-200 underline"
          >
            your Clerk account
          </a>
          .
        </p>
      </Section>

      {/* Plan */}
      <Section title="Your Plan">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PlanBadge plan={currentPlan} />
            <div>
              <p className="text-sm text-slate-200 font-medium">
                {currentPlan === 'FREE'
                  ? 'Free plan'
                  : currentPlan === 'READER'
                  ? 'Reader — $3.99/mo'
                  : currentPlan === 'COLLECTOR'
                  ? 'Collector — $7.99/mo'
                  : 'Bibliophile — $12.99/mo'}
              </p>
              {currentPlan === 'FREE' && (
                <p className="text-xs text-slate-500">1 shelf, 50 books max</p>
              )}
            </div>
          </div>
          {currentPlan !== 'BIBLIOPHILE' && (
            <Link to="/pricing">
              <Button size="sm" variant="secondary">
                Upgrade
              </Button>
            </Link>
          )}
        </div>
        {currentPlan !== 'FREE' && (
          <div className="mt-4 pt-4 border-t border-ink-muted">
            <Button variant="ghost" size="sm" onClick={() => {
              // TODO: redirect to Stripe billing portal
              void (async () => {
                try {
                  const res = await api.post<{ data: { url: string } }>('/v1/billing/portal')
                  window.location.href = res.data.data.url
                } catch { /* ignore */ }
              })()
            }}>
              Manage billing
            </Button>
          </div>
        )}
      </Section>

      {/* Import / Export */}
      <Section title="Import &amp; Export">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-200 font-medium">Export my data as CSV</p>
              <p className="text-xs text-slate-500">Download all your books, notes, and stats.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={exportLoading}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-200 font-medium">Delete account</p>
            <p className="text-xs text-slate-500">
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          {!deleteConfirm ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
            >
              Delete account
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-accent">Are you sure?</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  // No-op: confirmation UI only
                  setDeleteConfirm(false)
                  alert('Account deletion requires backend support. Please contact support.')
                }}
              >
                Yes, delete
              </Button>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
