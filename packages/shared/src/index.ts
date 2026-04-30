export type Plan = 'FREE' | 'READER' | 'COLLECTOR' | 'BIBLIOPHILE'

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

export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'READ' | 'DID_NOT_FINISH'

export type ShelfTheme = 'DARK_WOOD' | 'LIGHT_OAK' | 'WHITE_MINIMALIST' | 'VINTAGE'

export type ShelfSize = 'S' | 'M' | 'L' | 'XL'

export const SHELF_CAPACITY: Record<ShelfSize, number> = {
  S: 50,
  M: 150,
  L: 300,
  XL: 500
}

export const PLAN_LIMITS = {
  FREE: { shelves: 1, maxShelfSize: 'S' as ShelfSize, themes: false, goodreadsImport: false },
  READER: { shelves: 3, maxShelfSize: 'L' as ShelfSize, themes: false, goodreadsImport: true },
  COLLECTOR: { shelves: -1, maxShelfSize: 'XL' as ShelfSize, themes: true, goodreadsImport: true },
  BIBLIOPHILE: { shelves: -1, maxShelfSize: 'XL' as ShelfSize, themes: true, goodreadsImport: true }
} satisfies Record<Plan, { shelves: number; maxShelfSize: ShelfSize; themes: boolean; goodreadsImport: boolean }>

export interface BookDimensions {
  widthMm: number
  heightMm: number
  depthMm: number
}

export function calculateSpineWidth(pageCount: number): number {
  const pagesPerMm = 3.5
  return Math.max(5, Math.round(pageCount / pagesPerMm))
}

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: {
    code: string
    message: string
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError
