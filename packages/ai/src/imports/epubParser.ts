import EPub from 'epub2'
import type { ParsedBook } from './goodreadsParser.js'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

export async function parseEpub(buffer: Buffer): Promise<ParsedBook | null> {
  return new Promise((resolve) => {
    try {
      const tmpFile = path.join(os.tmpdir(), `epub_${Date.now()}.epub`)
      fs.writeFileSync(tmpFile, buffer)

      const epub = new EPub(tmpFile)
      epub.on('end', () => {
        try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
        const title = epub.metadata.title
        const author = epub.metadata.creator
        if (!title) {
          resolve(null)
          return
        }
        resolve({
          title: title.trim(),
          author: author?.trim() ?? 'Unknown',
          isbn: (epub.metadata as unknown as { ISBN?: string }).ISBN?.replace(/-/g, '') || undefined,
          status: 'WANT_TO_READ',
        })
      })
      epub.on('error', () => {
        try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
        resolve(null)
      })
      epub.parse()
    } catch {
      resolve(null)
    }
  })
}

export async function parseEpubZip(buffer: Buffer): Promise<ParsedBook[]> {
  const book = await parseEpub(buffer)
  return book ? [book] : []
}
