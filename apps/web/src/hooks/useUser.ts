import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useApi } from '../lib/api'
import { useUserStore } from '../stores/userStore'
import type { Plan } from '../stores/shelfStore'

interface UserMeResponse {
  plan: Plan
  usage: {
    shelvesUsed: number
    booksTotal: number
    booksReadThisYear: number
  }
}

export function useUser() {
  const api = useApi()
  const setPlan = useUserStore((s) => s.setPlan)
  const setUsage = useUserStore((s) => s.setUsage)

  const query = useQuery<UserMeResponse>({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await api.get<{ data: UserMeResponse }>('/v1/users/me')
      return res.data.data
    },
  })

  useEffect(() => {
    if (query.data) {
      setPlan(query.data.plan)
      setUsage(query.data.usage)
    }
  }, [query.data, setPlan, setUsage])

  return {
    plan: query.data?.plan,
    usage: query.data?.usage,
    isLoading: query.isLoading,
    error: query.error,
  }
}
