import clsx from 'clsx'

export type ImportSource =
  | 'goodreads'
  | 'kindle'
  | 'google_play'
  | 'kobo'
  | 'ibooks'
  | 'epub'
  | 'pdf'
  | 'manual'

interface Source {
  id: ImportSource
  label: string
  format: string
  difficulty: string
  difficultyLevel: 'easy' | 'medium' | 'hard'
  icon: string
}

const SOURCES: Source[] = [
  { id: 'kindle', label: 'Kindle', format: 'ZIP export', difficulty: 'Takes 2–3 days', difficultyLevel: 'hard', icon: 'K' },
  { id: 'google_play', label: 'Google Play', format: 'Takeout ZIP', difficulty: 'Medium — 3 steps', difficultyLevel: 'medium', icon: 'G' },
  { id: 'kobo', label: 'Kobo', format: 'CSV export', difficulty: 'Easy — 2 steps', difficultyLevel: 'easy', icon: 'Ko' },
  { id: 'ibooks', label: 'Apple Books', format: 'CSV export', difficulty: 'Easy — 2 steps', difficultyLevel: 'easy', icon: 'A' },
  { id: 'goodreads', label: 'Goodreads', format: 'CSV export', difficulty: 'Easy — 2 steps', difficultyLevel: 'easy', icon: 'Gr' },
  { id: 'epub', label: 'EPUB / PDF', format: 'File upload', difficulty: 'Easy — drop files', difficultyLevel: 'easy', icon: 'E' },
  { id: 'manual', label: 'Add manually', format: 'Type it in', difficulty: 'Easy', difficultyLevel: 'easy', icon: '+' },
]

const difficultyColors = {
  easy: 'bg-green-600/20 text-green-400',
  medium: 'bg-yellow-600/20 text-yellow-400',
  hard: 'bg-red-600/20 text-red-400',
}

interface ImportSourcePickerProps {
  onSelect: (source: ImportSource) => void
}

export default function ImportSourcePicker({ onSelect }: ImportSourcePickerProps) {
  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">Choose a source to import your books from.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SOURCES.map((src) => (
          <button
            key={src.id}
            type="button"
            onClick={() => onSelect(src.id)}
            className="flex flex-col gap-2 rounded-xl border border-ink-muted bg-ink p-4 text-left hover:border-shelf-500/60 hover:bg-ink-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500"
          >
            <div className="h-9 w-9 rounded-lg bg-shelf-500/20 flex items-center justify-center text-shelf-300 text-sm font-bold">
              {src.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{src.label}</p>
              <p className="text-xs text-slate-500">{src.format}</p>
            </div>
            <span
              className={clsx(
                'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                difficultyColors[src.difficultyLevel],
              )}
            >
              {src.difficulty}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
