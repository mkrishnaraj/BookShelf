import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useApi } from '../lib/api'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'

type Tab = 'notes' | 'dictionary'

interface Note {
  id: string
  bookTitle?: string
  content: string
  createdAt: string
}

interface DictionaryWord {
  id: string
  word: string
  definition: string
  bookTitle?: string
  createdAt: string
}

interface NotebookData {
  notes: Note[]
  words: DictionaryWord[]
}

function NoteCard({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-ink-muted bg-ink-light p-4">
      {note.bookTitle && (
        <p className="text-xs text-shelf-300 mb-1">{note.bookTitle}</p>
      )}
      <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.content}</p>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-slate-500">
          {new Date(note.createdAt).toLocaleDateString()}
        </p>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="text-xs text-slate-500 hover:text-accent transition-colors"
          aria-label={`Delete note`}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function DictionaryCard({ word, onDelete }: { word: DictionaryWord; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-ink-muted bg-ink-light p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-shelf-200">{word.word}</p>
          {word.bookTitle && (
            <p className="text-xs text-shelf-400 mt-0.5">from {word.bookTitle}</p>
          )}
          <p className="text-sm text-slate-300 mt-2">{word.definition}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(word.id)}
          className="flex-shrink-0 text-slate-500 hover:text-accent transition-colors"
          aria-label={`Delete word ${word.word}`}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function Notebook() {
  const api = useApi()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('notes')
  const [noteContent, setNoteContent] = useState('')
  const [noteBook, setNoteBook] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [wordModalOpen, setWordModalOpen] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [newDef, setNewDef] = useState('')
  const [wordBook, setWordBook] = useState('')

  const { data, isLoading } = useQuery<NotebookData>({
    queryKey: ['notebook'],
    queryFn: async () => {
      const res = await api.get<{ data: NotebookData }>('/v1/notebook')
      return res.data.data
    },
  })

  const addNote = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: Note }>('/v1/notebook/notes', {
        content: noteContent,
        bookTitle: noteBook || undefined,
      })
      return res.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notebook'] })
      setNoteContent('')
      setNoteBook('')
      setShowNoteForm(false)
    },
  })

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/notebook/notes/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notebook'] }),
  })

  const addWord = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: DictionaryWord }>('/v1/notebook/words', {
        word: newWord,
        definition: newDef,
        bookTitle: wordBook || undefined,
      })
      return res.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notebook'] })
      setNewWord('')
      setNewDef('')
      setWordBook('')
      setWordModalOpen(false)
    },
  })

  const deleteWord = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/notebook/words/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notebook'] }),
  })

  return (
    <div className="px-6 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Your Notebook</h1>
        <p className="mt-1 text-sm text-slate-400">Notes, highlights, and vocabulary from your reading.</p>
      </div>

      {/* Tab bar */}
      <div
        className="flex border-b border-ink-muted mb-6"
        role="tablist"
        aria-label="Notebook sections"
      >
        {(['notes', 'dictionary'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500 focus-visible:ring-inset',
              tab === t
                ? 'border-shelf-500 text-shelf-300'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            )}
          >
            {t === 'dictionary' ? 'Dictionary' : 'Notes'}
          </button>
        ))}
      </div>

      {/* Notes tab */}
      {tab === 'notes' && (
        <div role="tabpanel" aria-label="Notes">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowNoteForm((v) => !v)}>
              <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Note
            </Button>
          </div>

          {showNoteForm && (
            <form
              onSubmit={(e) => { e.preventDefault(); addNote.mutate() }}
              className="rounded-xl border border-shelf-500/30 bg-ink-light p-4 mb-4 space-y-3"
            >
              <div>
                <label htmlFor="note-book" className="block text-xs text-slate-400 mb-1">Book title (optional)</label>
                <input
                  id="note-book"
                  type="text"
                  value={noteBook}
                  onChange={(e) => setNoteBook(e.target.value)}
                  placeholder="e.g. The Great Gatsby"
                  className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
                />
              </div>
              <div>
                <label htmlFor="note-content" className="block text-xs text-slate-400 mb-1">Note *</label>
                <textarea
                  id="note-content"
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  placeholder="Write your note..."
                  className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-shelf-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowNoteForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" loading={addNote.isPending}>
                  Save note
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-ink-muted bg-ink-light p-4 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : data?.notes && data.notes.length > 0 ? (
            <div className="space-y-3">
              {data.notes.map((note) => (
                <NoteCard key={note.id} note={note} onDelete={(id) => deleteNote.mutate(id)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500 py-10">
              No notes yet. Start adding notes from your books.
            </p>
          )}
        </div>
      )}

      {/* Dictionary tab */}
      {tab === 'dictionary' && (
        <div role="tabpanel" aria-label="Dictionary">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setWordModalOpen(true)}>
              <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Word
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-ink-muted bg-ink-light p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : data?.words && data.words.length > 0 ? (
            <div className="space-y-3">
              {data.words.map((word) => (
                <DictionaryCard key={word.id} word={word} onDelete={(id) => deleteWord.mutate(id)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500 py-10">
              No words yet. Add new vocabulary as you discover it.
            </p>
          )}
        </div>
      )}

      {/* Add Word Modal */}
      <Modal open={wordModalOpen} onClose={() => setWordModalOpen(false)} title="Add a word" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); addWord.mutate() }} className="space-y-4">
          <div>
            <label htmlFor="dict-word" className="block text-sm font-medium text-slate-300 mb-1.5">
              Word *
            </label>
            <input
              id="dict-word"
              type="text"
              required
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>
          <div>
            <label htmlFor="dict-def" className="block text-sm font-medium text-slate-300 mb-1.5">
              Definition *
            </label>
            <textarea
              id="dict-def"
              required
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500 resize-none"
            />
          </div>
          <div>
            <label htmlFor="dict-book" className="block text-sm font-medium text-slate-300 mb-1.5">
              From which book? (optional)
            </label>
            <input
              id="dict-book"
              type="text"
              value={wordBook}
              onChange={(e) => setWordBook(e.target.value)}
              className="w-full rounded-lg bg-ink border border-ink-muted px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-shelf-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" type="button" onClick={() => setWordModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addWord.isPending}>Save word</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
