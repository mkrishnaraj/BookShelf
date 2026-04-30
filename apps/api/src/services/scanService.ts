/**
 * scanService.ts — Delegates image scanning to the packages/ai pipeline.
 * The ai package's scanBook/scanShelf take raw Buffers directly.
 */

import { scanBook, scanShelf } from 'ai'
import type { ScannedBook, ShelfScanResult } from 'ai'

export type { ScannedBook, ShelfScanResult }

/**
 * Identify a single book from a cover/spine photo.
 */
export async function identifyBookFromImage(buffer: Buffer): Promise<ScannedBook> {
  return scanBook(buffer)
}

/**
 * Identify all books visible in a full-shelf photograph.
 */
export async function identifyShelfFromImage(buffer: Buffer): Promise<ShelfScanResult> {
  return scanShelf(buffer)
}
