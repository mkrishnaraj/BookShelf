export interface BookData {
  id: string
  title: string
  author: string
  spineWidthMm: number   // default 20 if not set
  heightMm: number       // default 203
  depthMm: number        // default 130
  spineColor: string     // hex e.g. "#3b82f6", default "#8B5E3C"
  coverUrl?: string
  percentRead: number    // 0-100
  status: string
  positionOnShelf?: number
}

export interface ShelfConfig {
  theme: 'DARK_WOOD' | 'LIGHT_OAK' | 'WHITE_MINIMALIST' | 'VINTAGE'
  booksPerRow: number   // computed from shelf width / avg book spine width
  rows: number          // computed from total books
}

export type ShelfTheme = ShelfConfig['theme']
