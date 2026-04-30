import { create } from 'zustand'

export type Plan = 'FREE' | 'READER' | 'COLLECTOR' | 'BIBLIOPHILE'
export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'READ' | 'DID_NOT_FINISH'
export type BookSource =
  | 'MANUAL'
  | 'GOODREADS'
  | 'GOOGLE_BOOKS'
  | 'KINDLE'
  | 'GOOGLE_PLAY'
  | 'KOBO'
  | 'IBOOKS'
  | 'EPUB'
  | 'PDF'
  | 'CAMERA_SCAN'
export type ShelfTheme = 'DARK_WOOD' | 'LIGHT_OAK' | 'WHITE_MINIMALIST' | 'VINTAGE'
export type ShelfSize = 'S' | 'M' | 'L' | 'XL'

export interface Book {
  id: string
  shelfId: string
  title: string
  author: string
  isbn?: string | null
  coverUrl?: string | null
  pageCount?: number | null
  publishedYear?: number | null
  genre?: string | null
  description?: string | null
  status: ReadingStatus
  progressPercent: number
  rating?: number | null
  source: BookSource
  dominantColor?: string | null
  addedAt: string
  startedAt?: string | null
  finishedAt?: string | null
}

export interface Shelf {
  id: string
  userId: string
  name: string
  slug: string
  size: ShelfSize
  theme: ShelfTheme
  isPublic: boolean
  sortOrder: string
  bookCount: number
  createdAt: string
  updatedAt: string
}

interface ShelfState {
  shelves: Shelf[]
  selectedShelfId: string | null
  books: Map<string, Book[]>

  setShelves: (shelves: Shelf[]) => void
  setSelectedShelf: (shelfId: string) => void
  setBooks: (shelfId: string, books: Book[]) => void
  addBook: (shelfId: string, book: Book) => void
  removeBook: (shelfId: string, bookId: string) => void
  updateBook: (shelfId: string, book: Book) => void
}

export const useShelfStore = create<ShelfState>((set) => ({
  shelves: [],
  selectedShelfId: null,
  books: new Map(),

  setShelves: (shelves) => set({ shelves }),

  setSelectedShelf: (shelfId) => set({ selectedShelfId: shelfId }),

  setBooks: (shelfId, books) =>
    set((state) => {
      const next = new Map(state.books)
      next.set(shelfId, books)
      return { books: next }
    }),

  addBook: (shelfId, book) =>
    set((state) => {
      const next = new Map(state.books)
      const existing = next.get(shelfId) ?? []
      next.set(shelfId, [...existing, book])
      return { books: next }
    }),

  removeBook: (shelfId, bookId) =>
    set((state) => {
      const next = new Map(state.books)
      const existing = next.get(shelfId) ?? []
      next.set(
        shelfId,
        existing.filter((b) => b.id !== bookId),
      )
      return { books: next }
    }),

  updateBook: (shelfId, book) =>
    set((state) => {
      const next = new Map(state.books)
      const existing = next.get(shelfId) ?? []
      next.set(
        shelfId,
        existing.map((b) => (b.id === book.id ? book : b)),
      )
      return { books: next }
    }),
}))
