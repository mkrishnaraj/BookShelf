import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import type { ParsedBook } from './goodreadsParser.js'

/**
 * Parse metadata from an EPUB file buffer.
 *
 * EPUBs are ZIP archives. We write the buffer to a temp file, use epub2 to
 * parse the OPF metadata, then clean up. This avoids the need for a
 * ZIP library while keeping the logic dependency on the already-installed epub2.
 *
 * Page count is estimated from total character count across chapters
 * (~2500 chars per average page).
 */
export async function parseEpub(buffer: Buffer): Promise<ParsedBook | null> {
  // Write buffer to a temp file
  const tmpDir = os.tmpdir()
  const tmpFile = path.join(tmpDir, `bookshelf_epub_${Date.now()}_${Math.random().toString(36).slice(2)}.epub`)

  try {
    fs.writeFileSync(tmpFile, buffer)

    // Dynamically import epub2 (CJS module in an ESM package)
    const epub2Module = await import('epub2')
    const EPub = epub2Module.EPub ?? epub2Module.default

    const epub = await EPub.createAsync(tmpFile) as {
      metadata: {
        title?: string
        creator?: string
        ISBN?: string
        publisher?: string
        language?: string
      }
      flow: Array<{ id: string }>
      getChapterAsync: (id: string) => Promise<string>
    }

    const metadata = epub.metadata

    if (!metadata.title) return null

    // Estimate page count from chapter character counts
    let totalChars = 0
    const chapterSample = epub.flow.slice(0, Math.min(10, epub.flow.length))
    for (const chapter of chapterSample) {
      try {
        const text = await epub.getChapterAsync(chapter.id)
        // Strip HTML tags for character counting
        totalChars += text.replace(/<[^>]+>/g, '').length
      } catch {
        // Skip chapters that fail to load
      }
    }

    // Scale up if we only sampled partial chapters
    const ratio = epub.flow.length > 0 ? epub.flow.length / Math.max(chapterSample.length, 1) : 1
    const estimatedTotalChars = totalChars * ratio
    const estimatedPages = Math.max(1, Math.round(estimatedTotalChars / 2500))

    const isbn = metadata.ISBN?.replace(/-/g, '') || undefined
    const pageCount = estimatedPages > 5 ? estimatedPages : undefined

    return {
      title: metadata.title.trim(),
      author: metadata.creator?.trim() ?? 'Unknown',
      status: 'WANT_TO_READ',
      ...(isbn !== undefined ? { isbn } : {}),
      ...(pageCount !== undefined ? { pageCount } : {}),
    }
  } catch {
    return null
  } finally {
    // Always clean up the temp file
    try {
      fs.unlinkSync(tmpFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}
