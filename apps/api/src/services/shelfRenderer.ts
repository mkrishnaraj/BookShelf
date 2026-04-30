import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] ?? '',
  api_key: process.env['CLOUDINARY_API_KEY'] ?? '',
  api_secret: process.env['CLOUDINARY_API_SECRET'] ?? '',
})

export interface ShelfRenderOptions {
  shelfId: string
  publicSlug: string
  books: Array<{
    title: string
    author: string
    spineColor?: string | null
    spineWidthMm?: number | null
    coverUrl?: string | null
  }>
}

/**
 * Generate a shareable shelf preview image URL via Cloudinary transformations.
 * Returns a publicly accessible image URL.
 *
 * Builds a Cloudinary URL using text overlays for each book spine.
 * A more advanced canvas renderer is planned for Wave 3.
 */
export function generateShelfShareUrl(opts: ShelfRenderOptions): string {
  const cloudName = process.env['CLOUDINARY_CLOUD_NAME']
  if (!cloudName) {
    return `https://placehold.co/1200x400/5c3d1e/ffffff?text=Virtual+Bookshelf`
  }

  const baseImagePublicId = 'virtual-bookshelf/shelf-bg'
  const transformations: string[] = []

  opts.books.slice(0, 20).forEach((book, i) => {
    const xOffset = 40 + i * 55
    const label = encodeURIComponent(book.title.slice(0, 12))
    const authorLabel = encodeURIComponent(book.author.split(' ').pop() ?? '')
    transformations.push(`l_text:Arial_14_bold:${label},co_rgb:ffffff,x_${xOffset},y_50,g_west`)
    transformations.push(`l_text:Arial_10:${authorLabel},co_rgb:eeeeee,x_${xOffset},y_80,g_west`)
  })

  const transformStr = transformations.length > 0 ? `${transformations.join('/')}/` : ''
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}${baseImagePublicId}.jpg`
}

/**
 * Upload a book cover image buffer to Cloudinary and return the secure URL.
 */
export async function uploadBookCover(
  buffer: Buffer,
  bookId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'virtual-bookshelf/covers',
        public_id: `book-${bookId}`,
        overwrite: true,
        transformation: [{ width: 400, height: 600, crop: 'fill' }],
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result?.secure_url ?? '')
      }
    )
    uploadStream.end(buffer)
  })
}
