// Sentry is optional — only activates when SENTRY_DSN env var is set.
// Add @sentry/node to package.json dependencies to enable it.
export function initSentry(): void {
  const dsn = process.env['SENTRY_DSN']
  if (!dsn) return
  void (async () => {
    try {
      // Dynamic require avoids a hard dep — @sentry/node is an optional peer
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { init } = require('@sentry/node') as { init: (opts: Record<string, unknown>) => void }
      init({ dsn, tracesSampleRate: 0.1, environment: process.env['NODE_ENV'] ?? 'development' })
    } catch { /* Sentry not installed — safe to skip */ }
  })()
}
