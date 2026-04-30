import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-shelf-500 text-shelf-50 hover:bg-shelf-600 focus-visible:ring-shelf-500 disabled:bg-shelf-700 disabled:text-shelf-400',
  secondary:
    'bg-ink-light border border-ink-muted text-slate-300 hover:border-shelf-500 hover:text-slate-100 focus-visible:ring-shelf-500 disabled:opacity-50',
  ghost:
    'text-slate-400 hover:bg-ink-light hover:text-slate-200 focus-visible:ring-ink-muted disabled:opacity-50',
  danger:
    'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg gap-2',
  lg: 'px-6 py-3 text-base font-semibold rounded-lg gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled ?? loading}
      className={clsx(
        'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
