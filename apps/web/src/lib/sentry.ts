// Sentry is an optional peer dep. This stub is a no-op unless @sentry/react
// is added to package.json. The dynamic import path is a compile-time constant
// so it satisfies tsc without a type declaration file.
export function initSentry(): void {
  const dsn = import.meta.env['VITE_SENTRY_DSN'] as string | undefined
  if (!dsn) return
  // Intentionally left as a no-op stub until @sentry/react is installed.
  // To enable: `pnpm --filter web add @sentry/react` then replace this body
  // with: init({ dsn, tracesSampleRate: 0.05 })
  console.debug('[Sentry] DSN set but @sentry/react not installed — skipping init')
}
