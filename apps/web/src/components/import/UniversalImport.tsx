import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import ImportSourcePicker, { type ImportSource } from './ImportSourcePicker'
import ImportInstructions from './ImportInstructions'
import ImportDropzone from './ImportDropzone'
import ImportPreview, { type ParsedBook } from './ImportPreview'
import ImportProgress from './ImportProgress'
import { useApi } from '../../lib/api'
import { useShelves } from '../../hooks/useShelves'

type Step = 'pick' | 'instructions' | 'dropzone' | 'preview' | 'progress'

interface UniversalImportProps {
  open: boolean
  onClose: () => void
  defaultShelfId?: string
}

interface ParseResponse {
  sourceName: string
  books: ParsedBook[]
  warnings: string[]
}

export default function UniversalImport({ open, onClose, defaultShelfId }: UniversalImportProps) {
  const api = useApi()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { shelves } = useShelves()

  const [step, setStep] = useState<Step>('pick')
  const [source, setSource] = useState<ImportSource | null>(null)
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null)
  const [confirmedShelfId, setConfirmedShelfId] = useState<string>('')
  const [confirmedBookIds, setConfirmedBookIds] = useState<string[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  function handleSourceSelect(src: ImportSource) {
    setSource(src)
    if (src === 'manual') {
      // Jump straight to instructions (which say "Add manually")
      setStep('instructions')
    } else {
      setStep('instructions')
    }
  }

  function handleInstructionsContinue() {
    if (source === 'manual') {
      onClose()
      // Let parent handle opening BookSearchModal or similar
      return
    }
    setStep('dropzone')
  }

  async function handleFileAccepted(file: File) {
    setParsing(true)
    setParseError(null)
    const formData = new FormData()
    formData.append('file', file)
    if (source) formData.append('source', source)

    try {
      const res = await api.post<{ data: ParseResponse }>('/v1/import/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setParseResult(res.data.data)
      setStep('preview')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setParsing(false)
    }
  }

  function handleConfirm(selectedIds: string[], shelfId: string) {
    setConfirmedBookIds(selectedIds)
    setConfirmedShelfId(shelfId)
    setStep('progress')
  }

  function handleImportComplete() {
    void queryClient.invalidateQueries({ queryKey: ['books', confirmedShelfId] })
    void queryClient.invalidateQueries({ queryKey: ['shelves'] })
    onClose()
    if (confirmedShelfId) {
      navigate(`/shelf/${confirmedShelfId}`)
    }
  }

  function handleClose() {
    setStep('pick')
    setSource(null)
    setParseResult(null)
    setParseError(null)
    onClose()
  }

  const titleMap: Record<Step, string> = {
    pick: 'Add books from your libraries',
    instructions: 'How to export',
    dropzone: 'Upload your file',
    preview: 'Review books',
    progress: 'Importing your books',
  }

  return (
    <Modal open={open} onClose={handleClose} title={titleMap[step]} size="lg">
      {step === 'pick' && <ImportSourcePicker onSelect={handleSourceSelect} />}

      {step === 'instructions' && source && (
        <ImportInstructions
          source={source}
          onBack={() => setStep('pick')}
          onContinue={handleInstructionsContinue}
        />
      )}

      {step === 'dropzone' && (
        <div>
          {parseError && (
            <div className="mb-4 rounded-lg bg-accent/10 border border-accent/30 px-4 py-3 text-sm text-accent">
              {parseError} —{' '}
              <button
                type="button"
                onClick={() => setParseError(null)}
                className="underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}
          {parsing ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-shelf-500 border-t-transparent" />
              <p className="text-sm text-slate-400">Parsing your file...</p>
            </div>
          ) : (
            <ImportDropzone
              onFileAccepted={handleFileAccepted}
              onBack={() => setStep('instructions')}
            />
          )}
        </div>
      )}

      {step === 'preview' && parseResult && (
        <ImportPreview
          parsedBooks={parseResult.books}
          warnings={parseResult.warnings}
          sourceName={parseResult.sourceName}
          shelves={shelves}
          defaultShelfId={defaultShelfId}
          onConfirm={handleConfirm}
          onBack={() => setStep('dropzone')}
        />
      )}

      {step === 'progress' && (
        <ImportProgress
          total={confirmedBookIds.length}
          shelfId={confirmedShelfId}
          selectedBookIds={confirmedBookIds}
          source={source ?? 'MANUAL'}
          onComplete={handleImportComplete}
          onBackground={handleClose}
        />
      )}
    </Modal>
  )
}
