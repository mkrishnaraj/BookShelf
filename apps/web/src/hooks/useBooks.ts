import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useApi } from '../lib/api'
import { useShelfStore, type Book } from '../stores/shelfStore'

export function useBooks(shelfId: string | undefined) {
  const api = useApi()
  const queryClient = useQueryClient()
  const setBooks = useShelfStore((s) => s.setBooks)
  const addBookToStore = useShelfStore((s) => s.addBook)
  const updateBookInStore = useShelfStore((s) => s.updateBook)
  const removeBookFromStore = useShelfStore((s) => s.removeBook)

  const query = useQuery<Book[]>({
    queryKey: ['books', shelfId],
    queryFn: async () => {
      const res = await api.get<{ data: Book[] }>(`/v1/shelves/${shelfId}/books`)
      return res.data.data
    },
    enabled: !!shelfId,
  })

  useEffect(() => {
    if (query.data && shelfId) {
      setBooks(shelfId, query.data)
    }
  }, [query.data, shelfId, setBooks])

  const addBook = useMutation({
    mutationFn: async (payload: Omit<Book, 'id' | 'addedAt'>) => {
      const res = await api.post<{ data: Book }>(`/v1/shelves/${shelfId}/books`, payload)
      return res.data.data
    },
    onSuccess: (book) => {
      if (shelfId) addBookToStore(shelfId, book)
      void queryClient.invalidateQueries({ queryKey: ['books', shelfId] })
    },
  })

  const updateBook = useMutation({
    mutationFn: async (book: Book) => {
      const res = await api.patch<{ data: Book }>(`/v1/shelves/${shelfId}/books/${book.id}`, book)
      return res.data.data
    },
    onSuccess: (book) => {
      if (shelfId) updateBookInStore(shelfId, book)
      void queryClient.invalidateQueries({ queryKey: ['books', shelfId] })
    },
  })

  const deleteBook = useMutation({
    mutationFn: async (bookId: string) => {
      await api.delete(`/v1/shelves/${shelfId}/books/${bookId}`)
      return bookId
    },
    onSuccess: (bookId) => {
      if (shelfId) removeBookFromStore(shelfId, bookId)
      void queryClient.invalidateQueries({ queryKey: ['books', shelfId] })
    },
  })

  return {
    books: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addBook,
    updateBook,
    deleteBook,
  }
}
