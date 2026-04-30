import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import clsx from 'clsx'
import Button from '../ui/Button'

interface ImportDropzoneProps {
  onFileAccepted: (file: File) => void
  onBack: () => void
}

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
const ACCEPTED_TYPES = {
  'application/json': ['.json'],
  'application/zip': ['.zip'],
  'application/epub+zip': ['.epub'],
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
}

export default function ImportDropzone({ onFileAccepted, onBack }: ImportDropzoneProps) {
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setSizeError(null)
      if (rejected.length > 0) {
        const errCode = rejected[0]?.errors[0]?.code
        if (errCode === 'file-too-large') {
          setSizeError('File too large — max 50 MB')
        } else {
          setSizeError('Unsupported file type')
        }
        return
      }
      if (accepted[0]) {
        setSelectedFile(accepted[0])
      }
    },
    [],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
  })

  function handleUpload() {
    if (!selectedFile) return
    setUploadProgress(0)

    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    })
    xhr.addEventListener('load', () => {
      setUploadProgress(100)
      setTimeout(() => onFileAccepted(selectedFile), 300)
    })
    xhr.addEventListener('error', () => {
      setSizeError('Upload failed. Please try again.')
      setUploadProgress(null)
    })
    // The actual XHR is handled by the parent; we just pass the file through
    // For now, simulate file passing directly
    onFileAccepted(selectedFile)
  }

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

      <div
        {...getRootProps()}
        className={clsx(
          'rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500',
          isDragActive
            ? 'border-shelf-500 bg-shelf-500/10'
            : selectedFile
            ? 'border-green-500/60 bg-green-500/5'
            : 'border-ink-muted hover:border-shelf-500/50 hover:bg-ink-light',
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="space-y-2">
            <svg aria-hidden="true" className="mx-auto h-10 w-10 text-green-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-sm text-slate-200">{selectedFile.name}</p>
            <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
            <p className="text-xs text-shelf-400">Click or drag to replace</p>
          </div>
        ) : (
          <div className="space-y-3">
            <svg aria-hidden="true" className="mx-auto h-10 w-10 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-300">
                {isDragActive ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-slate-600">JSON, ZIP, EPUB, PDF, CSV, TXT — max 50 MB</p>
          </div>
        )}
      </div>

      {sizeError && (
        <p className="text-sm text-accent" role="alert">
          {sizeError}
        </p>
      )}

      {uploadProgress !== null && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-ink-muted/40">
            <div
              className="h-full rounded-full bg-shelf-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || uploadProgress !== null}
        className="w-full"
      >
        Upload and parse
      </Button>
    </div>
  )
}
