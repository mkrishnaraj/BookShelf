import { create } from 'zustand'

export type ModalType = 'addBook' | 'import' | 'share' | 'upgrade'

interface UiState {
  sidebarOpen: boolean
  activeModal: ModalType | null
  theme: string

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (modal: ModalType) => void
  closeModal: () => void
  setTheme: (theme: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  theme: 'dark-wood',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setTheme: (theme) => set({ theme }),
}))
