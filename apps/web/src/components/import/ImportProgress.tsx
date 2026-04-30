import { useEffect, useState } from 'react'
import Button from '../ui/Button'

interface ImportProgressProps {
  total: number
  shelfId: string
  selectedBookIds: string[]
  source: string
  onComplete: () => void
  onBackground: () => void
}

export default function ImportProgress({
  total,
  shelfId,
  selectedBookIds,
  source,
  onComplete,
  onBackground,
}: ImportProgressProps) {
  const [current, setCurrent] = useState(0)
  const [currentTitle, setCurrentTitle] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const startTime = useState(() => Date.now())[0]

  const elapsed = Date.now() - startTime
  const rate = current > 0 ? elapsed / current : 0
  const remaining = rate > 0 && current < total ? Math.round((rate * (total - current)) / 1000) : null

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL ?? '/api'
    const url = `${baseUrl}/v1/import/confirm`

    const body = JSON.stringify({ shelfId, bookIds: selectedBookIds, source })
    const ctrl = new AbortController()

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`)
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const evt = JSON.parse(line.slice(6)) as {
                type: string
                index?: number
                title?: string
              }
              if (evt.type === 'progress' && evt.index !== undefined) {
                setCurrent(evt.index)
                if (evt.title) setCurrentTitle(evt.title)
              }
              if (evt.type === 'done') {
                setDone(true)
                onComplete()
              }
            } catch {
              // malformed SSE line — ignore
            }
          }
        }
        setDone(true)
        onComplete()
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Import failed')
      })

    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="space-y-4 text-center py-6">
        <p className="text-accent text-sm">{error}</p>
        <Button variant="secondary" onClick={onBackground}>
          Close
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-4 text-center py-6">
        <svg aria-hidden="true" className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-slate-100 font-semibold">{total} books added to your shelf!</p>
        <Button onClick={onComplete} className="mx-auto">
          View shelf
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 py-2">
      <div>
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Enriching book {current} of {total}...</span>
          <span>{pct}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-ink-muted/40"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-shelf-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {currentTitle && (
        <p className="text-sm text-slate-400 truncate">
          Processing: <span className="text-slate-200">{currentTitle}</span>
        </p>
      )}

      {remaining !== null && (
        <p className="text-xs text-slate-500">
          About {remaining < 60 ? `${remaining}s` : `${Math.round(remaining / 60)}m`} remaining
        </p>
      )}

      <Button variant="ghost" size="sm" onClick={onBackground} className="w-full">
        Import in background — I will close this
      </Button>
    </div>
  )
}
