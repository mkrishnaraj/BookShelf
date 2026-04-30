import { create } from 'zustand'
import type { Plan } from './shelfStore'

interface UsageStats {
  shelvesUsed: number
  booksTotal: number
  booksReadThisYear: number
}

interface UserState {
  plan: Plan
  usage: UsageStats

  setPlan: (plan: Plan) => void
  setUsage: (usage: UsageStats) => void
}

export const useUserStore = create<UserState>((set) => ({
  plan: 'FREE',
  usage: {
    shelvesUsed: 0,
    booksTotal: 0,
    booksReadThisYear: 0,
  },

  setPlan: (plan) => set({ plan }),
  setUsage: (usage) => set({ usage }),
}))
