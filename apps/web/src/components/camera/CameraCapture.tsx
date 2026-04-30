import { useRef, useState } from 'react'
import Button from '../ui/Button'
import ScanConfirm from './ScanConfirm'
import ShelfScanReview from './ShelfScanReview'
import { useApi } from '../../lib/api'
import type { Book } from '../../stores/shelfStore'

interface EnrichedBook {
  title: string
  author: string
  coverUrl?: string
  pageCount?: number
  isbn?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface ShelfScanResult {
  books: EnrichedBook[]
  unreadableCount: number
}

interface CameraCaptureProps {
  mode: 'cover' | 'shelf'
  shelfId: string
  onComplete: (books: Partial<Book>[]) => void
  onCancel: () => void
}

async function compressImage(file: File, maxWidthPx = 1600): Promise<Blob> {
  const img = await createImageBitmap(file)
  const scale = Math.min(1, maxWidthPx / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/jpeg', 0.85)
  })
}

export default function CameraCapture({ mode, shelfId, onComplete, onCancel }: CameraCaptureProps) {
  const api = useApi()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Results
  const [coverResult, setCoverResult] = useState<EnrichedBook | null>(null)
  const [shelfResult, setShelfResult] = useState<ShelfScanResult | null>(null)

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleScan() {
    if (!selectedFile) return
    setScanning(true)
    setError(null)

    try {
      const compressed = await compressImage(selectedFile)
      const form = new FormData()
      form.append('image', compressed, 'scan.jpg')
      form.append('shelfId', shelfId)

      const endpoint = mode === 'cover' ? '/v1/books/scan/cover' : '/v1/books/scan/shelf'
      const res = await api.post<{ data: EnrichedBook | ShelfScanResult }>(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (mode === 'cover') {
        setCoverResult(res.data.data as EnrichedBook)
      } else {
        setShelfResult(res.data.data as ShelfScanResult)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  function handleRetry() {
    setPreview(null)
    setSelectedFile(null)
    setCoverResult(null)
    setShelfResult(null)
    setError(null)
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = ''
  }

  // Show ScanConfirm after single-book scan
  if (coverResult) {
    return (
      <ScanConfirm
        book={coverResult}
        shelfId={shelfId}
        onConfirm={(book) => onComplete([book])}
        onRetry={handleRetry}
      />
    )
  }

  // Show ShelfScanReview after shelf scan
  if (shelfResult) {
    return (
      <ShelfScanReview
        books={shelfResult.books}
        unreadableCount={shelfResult.unreadableCount}
        shelfId={shelfId}
        onConfirm={onComplete}
        onRetry={handleRetry}
      />
    )
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-slate-100">
          {mode === 'cover' ? 'Scan a book cover' : 'Scan your physical shelf'}
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          {mode === 'cover'
            ? 'Take a clear photo of the front cover or spine.'
            : 'Take a photo of your bookshelf. We will identify the spines.'}
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        capture={isMobile ? 'environment' : undefined}
        className="sr-only"
        onChange={handleImageSelected}
        aria-label={mode === 'cover' ? 'Take a photo of your book' : 'Take a photo of your shelf'}
      />

      {/* Preview or capture zone */}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-ink">
          <img src={preview} alt="Preview of selected image" className="w-full max-h-64 object-contain" />
          <button
            type="button"
            onClick={handleRetry}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
            aria-label="Remove image"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-ink-muted hover:border-shelf-500/60 bg-ink p-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500"
        >
          <svg aria-hidden="true" className="mx-auto h-10 w-10 text-slate-500 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <p className="text-sm text-slate-300 font-medium">
            {isMobile
              ? mode === 'cover' ? 'Take a photo of your book' : 'Take a photo of your shelf'
              : 'Choose an image file'}
          </p>
          <p className="text-xs text-slate-500 mt-1">JPG, PNG, HEIC, WebP</p>
        </button>
      )}

      {scanning && (
        <div className="flex items-center gap-3 rounded-lg bg-ink border border-ink-muted px-4 py-3">
          <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-shelf-500 border-t-transparent" />
          <p className="text-sm text-slate-300">
            {mode === 'cover' ? 'Identifying your book...' : 'Identifying books on your shelf...'}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-accent/10 border border-accent/30 px-4 py-3">
          <p className="text-sm text-accent">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-1 text-xs text-slate-300 hover:text-slate-100 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleScan}
          disabled={!selectedFile || scanning}
          loading={scanning}
          className="flex-1"
        >
          {mode === 'cover' ? 'Scan this book' : 'Scan this shelf'}
        </Button>
      </div>
    </div>
  )
}
