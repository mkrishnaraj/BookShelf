import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function handleOnline() {
      setOffline(false)
      setDismissed(false)
    }
    function handleOffline() {
      setOffline(true)
      setDismissed(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline || dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 bg-yellow-400 px-4 py-2.5 text-sm font-medium text-yellow-900 shadow-md"
    >
      <div className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-4 w-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728"
          />
        </svg>
        <span>You're offline — your shelf is still viewable</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline notice"
        className="rounded p-0.5 hover:bg-yellow-500/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-700"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
