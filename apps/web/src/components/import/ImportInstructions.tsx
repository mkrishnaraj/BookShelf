import type { ImportSource } from './ImportSourcePicker'
import Button from '../ui/Button'

interface Step {
  step: number
  text: string
}

interface SourceInstructions {
  title: string
  timeEstimate: string
  steps: Step[]
  note?: string
}

const INSTRUCTIONS: Record<string, SourceInstructions> = {
  kindle: {
    title: 'Export your Kindle library',
    timeEstimate: 'Takes 2–3 days (Amazon processing time)',
    steps: [
      { step: 1, text: 'Go to amazon.com → Account & Lists → Account' },
      { step: 2, text: 'Scroll to "Data and Privacy" → click "Request My Data"' },
      { step: 3, text: 'Select "Digital Content / Your Kindle Library"' },
      { step: 4, text: 'Submit the request — Amazon will email you a ZIP file in 2–3 days' },
      { step: 5, text: 'Download the ZIP file and upload it here' },
    ],
  },
  google_play: {
    title: 'Export from Google Play Books',
    timeEstimate: 'About 15 minutes',
    steps: [
      { step: 1, text: 'Go to takeout.google.com' },
      { step: 2, text: 'Click "Deselect all", then find and select "Google Play Books"' },
      { step: 3, text: 'Click "Next step" → "Create export"' },
      { step: 4, text: 'Wait for the export to complete, then download the ZIP' },
      { step: 5, text: 'Upload the ZIP file here' },
    ],
  },
  kobo: {
    title: 'Export your Kobo library',
    timeEstimate: 'About 5 minutes',
    steps: [
      { step: 1, text: 'Log in to kobo.com' },
      { step: 2, text: 'Click your name → My Books' },
      { step: 3, text: 'Click the "Export" button to download a CSV file' },
      { step: 4, text: 'Upload the CSV file here' },
    ],
  },
  ibooks: {
    title: 'Export from Apple Books',
    timeEstimate: 'About 5 minutes (Mac required)',
    steps: [
      { step: 1, text: 'Download "Books Exporter" from the Mac App Store (free)' },
      { step: 2, text: 'Open the app — it will scan your Apple Books library' },
      { step: 3, text: 'Click "Export as CSV"' },
      { step: 4, text: 'Upload the CSV file here' },
    ],
    note: 'No Mac? Download our CSV template, fill it in manually, and upload it.',
  },
  goodreads: {
    title: 'Export from Goodreads',
    timeEstimate: 'About 5 minutes',
    steps: [
      { step: 1, text: 'Log in to goodreads.com' },
      { step: 2, text: 'Go to My Books → Import/Export (bottom of left sidebar)' },
      { step: 3, text: 'Click "Export Library" and wait for the email' },
      { step: 4, text: 'Download the CSV and upload it here' },
    ],
  },
  epub: {
    title: 'Upload EPUB, PDF or ZIP files',
    timeEstimate: 'Instant',
    steps: [
      { step: 1, text: 'Drop your .epub or .pdf files onto the upload area, or click to browse' },
      { step: 2, text: 'For multiple files, zip them first and upload the ZIP' },
      { step: 3, text: 'We will extract title, author, and page count automatically' },
    ],
    note: 'Max file size: 50 MB. Supported formats: .epub, .pdf, .zip, .csv, .json',
  },
  manual: {
    title: 'Add books manually',
    timeEstimate: 'As long as you need',
    steps: [
      { step: 1, text: 'Fill in the book title (required)' },
      { step: 2, text: 'Add the author name and page count (optional but recommended)' },
      { step: 3, text: 'We will try to find cover art and metadata automatically' },
    ],
  },
}

interface ImportInstructionsProps {
  source: ImportSource
  onBack: () => void
  onContinue: () => void
}

export default function ImportInstructions({ source, onBack, onContinue }: ImportInstructionsProps) {
  const instructions = INSTRUCTIONS[source]
  if (!instructions) return null

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h3 className="text-base font-semibold text-slate-100">{instructions.title}</h3>
        <p className="text-sm text-slate-400 mt-1">{instructions.timeEstimate}</p>
      </div>

      <ol className="space-y-3">
        {instructions.steps.map((s) => (
          <li key={s.step} className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-shelf-500/20 text-shelf-300 text-xs font-bold flex items-center justify-center">
              {s.step}
            </span>
            <p className="text-sm text-slate-300 pt-0.5">{s.text}</p>
          </li>
        ))}
      </ol>

      {instructions.note && (
        <div className="rounded-lg bg-ink border border-ink-muted px-4 py-3 text-sm text-slate-400">
          {instructions.note}
        </div>
      )}

      <Button onClick={onContinue} className="w-full">
        {source === 'manual' ? 'Add book manually' : 'I have the file — continue'}
      </Button>
    </div>
  )
}
