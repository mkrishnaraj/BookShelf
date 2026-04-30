import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useApi } from '../lib/api'
import { useShelfStore, type Shelf } from '../stores/shelfStore'

export function useShelves() {
  const api = useApi()
  const setShelves = useShelfStore((s) => s.setShelves)

  const query = useQuery<Shelf[]>({
    queryKey: ['shelves'],
    queryFn: async () => {
      const res = await api.get<{ data: Shelf[] }>('/v1/shelves')
      return res.data.data
    },
  })

  useEffect(() => {
    if (query.data) {
      setShelves(query.data)
    }
  }, [query.data, setShelves])

  return {
    shelves: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
