import { describe, it, expect } from 'vitest'
import { parseGoodreadsCSV } from '../imports/goodreadsParser.js'

// Minimal Goodreads CSV header (24 columns as per the real export format)
const CSV_HEADER =
  'Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies'

/**
 * Build a single CSV data row with sensible defaults.
 * Values that contain commas are quoted so the parser handles them correctly.
 */
function quoteField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function makeLine(overrides: Partial<Record<string, string>> = {}): string {
  const defaults: Record<string, string> = {
    'Book Id': '1',
    Title: 'The Great Gatsby',
    Author: 'F. Scott Fitzgerald',
    // Use a non-comma form so we don't need to quote it
    'Author l-f': 'Fitzgerald F Scott',
    'Additional Authors': '',
    ISBN: '="0743273567"',
    ISBN13: '="9780743273565"',
    'My Rating': '4',
    'Average Rating': '3.91',
    Publisher: 'Scribner',
    Binding: 'Paperback',
    'Number of Pages': '180',
    'Year Published': '2004',
    'Original Publication Year': '1925',
    // Default to empty so tests that override Date Read to '' work correctly
    'Date Read': '',
    'Date Added': '2023/01/01',
    Bookshelves: '',
    'Bookshelves with positions': '',
    'Exclusive Shelf': 'read',
    'My Review': '',
    Spoiler: '',
    'Private Notes': '',
    'Read Count': '1',
    'Owned Copies': '0',
  }
  const merged = { ...defaults, ...overrides }
  // Maintain column order from header
  const keys = CSV_HEADER.split(',')
  return keys.map((k) => quoteField(merged[k.trim()] ?? '')).join(',')
}

describe('parseGoodreadsCSV', () => {
  describe('happy path — 3 books', () => {
    const csv = [
      CSV_HEADER,
      makeLine({ 'Book Id': '1', Title: 'Book One', Author: 'Author A', 'Exclusive Shelf': 'read', 'My Rating': '5', ISBN13: '="9780743273565"' }),
      makeLine({ 'Book Id': '2', Title: 'Book Two', Author: 'Author B', 'Exclusive Shelf': 'currently-reading', 'My Rating': '0' }),
      makeLine({ 'Book Id': '3', Title: 'Book Three', Author: 'Author C', 'Exclusive Shelf': 'to-read', 'My Rating': '0' }),
    ].join('\n')

    it('returns exactly 3 books', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books).toHaveLength(3)
    })

    it('parses title and author correctly', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.title).toBe('Book One')
      expect(books[0]?.author).toBe('Author A')
    })

    it('maps "read" shelf → READ status', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.status).toBe('READ')
    })

    it('maps "currently-reading" shelf → READING status', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books[1]?.status).toBe('READING')
    })

    it('maps "to-read" shelf → WANT_TO_READ status', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books[2]?.status).toBe('WANT_TO_READ')
    })

    it('parses rating when present and > 0', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.rating).toBe(5)
    })

    it('omits rating when My Rating is 0', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books[1]?.rating).toBeUndefined()
    })

    it('parses ISBN13 (strips Goodreads ="..." wrapper)', () => {
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.isbn).toBe('9780743273565')
    })
  })

  describe('shelf status edge cases', () => {
    it('unknown shelf value defaults to WANT_TO_READ', () => {
      const csv = [CSV_HEADER, makeLine({ 'Exclusive Shelf': 'favorites' })].join('\n')
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.status).toBe('WANT_TO_READ')
    })

    it('shelf comparison is case-insensitive', () => {
      const csvRead = [CSV_HEADER, makeLine({ 'Exclusive Shelf': 'Read' })].join('\n')
      const csvReading = [CSV_HEADER, makeLine({ 'Exclusive Shelf': 'Currently-Reading' })].join('\n')
      expect(parseGoodreadsCSV(csvRead)[0]?.status).toBe('READ')
      expect(parseGoodreadsCSV(csvReading)[0]?.status).toBe('READING')
    })
  })

  describe('page count and date parsing', () => {
    it('parses pageCount correctly', () => {
      const csv = [CSV_HEADER, makeLine({ 'Number of Pages': '320' })].join('\n')
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.pageCount).toBe(320)
    })

    it('omits pageCount when field is empty', () => {
      const csv = [CSV_HEADER, makeLine({ 'Number of Pages': '' })].join('\n')
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.pageCount).toBeUndefined()
    })

    it('parses dateRead when present', () => {
      const csv = [CSV_HEADER, makeLine({ 'Date Read': '2023/06/20', 'Exclusive Shelf': 'read' })].join('\n')
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.dateRead).toBeInstanceOf(Date)
      expect(isNaN((books[0]?.dateRead as Date).getTime())).toBe(false)
    })

    it('omits dateRead when field is empty', () => {
      const csv = [CSV_HEADER, makeLine({ 'Date Read': '' })].join('\n')
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.dateRead).toBeUndefined()
    })
  })

  describe('empty and minimal inputs', () => {
    it('empty string returns []', () => {
      expect(parseGoodreadsCSV('')).toEqual([])
    })

    it('header-only CSV returns []', () => {
      expect(parseGoodreadsCSV(CSV_HEADER)).toEqual([])
    })

    it('header + blank line returns []', () => {
      expect(parseGoodreadsCSV(CSV_HEADER + '\n')).toEqual([])
    })
  })

  describe('malformed / edge-case CSV', () => {
    it('does not throw on a line missing title', () => {
      const csv = [CSV_HEADER, makeLine({ Title: '' })].join('\n')
      expect(() => parseGoodreadsCSV(csv)).not.toThrow()
    })

    it('skips rows that have no title', () => {
      const csv = [CSV_HEADER, makeLine({ Title: '' })].join('\n')
      expect(parseGoodreadsCSV(csv)).toHaveLength(0)
    })

    it('does not throw on a line missing author', () => {
      const csv = [CSV_HEADER, makeLine({ Author: '' })].join('\n')
      expect(() => parseGoodreadsCSV(csv)).not.toThrow()
    })

    it('skips rows that have no author', () => {
      const csv = [CSV_HEADER, makeLine({ Author: '' })].join('\n')
      expect(parseGoodreadsCSV(csv)).toHaveLength(0)
    })

    it('handles quoted fields containing commas', () => {
      // Pass the title without outer quotes — quoteField() will wrap it because it contains commas
      const csv = [
        CSV_HEADER,
        makeLine({ Title: 'The Lion, the Witch and the Wardrobe', Author: 'C.S. Lewis', 'Exclusive Shelf': 'read' }),
      ].join('\n')
      const books = parseGoodreadsCSV(csv)
      expect(books).toHaveLength(1)
      expect(books[0]?.title).toBe('The Lion, the Witch and the Wardrobe')
    })

    it('does not throw on completely garbage input', () => {
      expect(() => parseGoodreadsCSV('not,a,valid,csv\nmore,garbage')).not.toThrow()
    })

    it('does not throw on a single character string', () => {
      expect(() => parseGoodreadsCSV('x')).not.toThrow()
    })

    it('ISBN13 missing (empty) is omitted from result', () => {
      const csv = [CSV_HEADER, makeLine({ ISBN: '', ISBN13: '' })].join('\n')
      const books = parseGoodreadsCSV(csv)
      expect(books[0]?.isbn).toBeUndefined()
    })
  })
})
