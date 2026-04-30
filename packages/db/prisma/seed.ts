import { PrismaClient, BookSource, ReadingStatus, ShelfSize, ShelfTheme, Plan } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ─── Clean existing demo data ────────────────────────────────────────────────
  await prisma.user.deleteMany({ where: { clerkId: 'demo_user_1' } })

  // ─── Demo User ────────────────────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      clerkId: 'demo_user_1',
      email: 'demo@bookshelf.app',
      name: 'Demo Reader',
      plan: Plan.FREE,
    },
  })

  console.log(`Created user: ${user.email}`)

  // ─── Shelves ──────────────────────────────────────────────────────────────────
  const myLibrary = await prisma.shelf.create({
    data: {
      userId: user.id,
      name: 'My Library',
      size: ShelfSize.S,
      theme: ShelfTheme.DARK_WOOD,
      sortOrder: 0,
      isPublic: true,
      publicSlug: 'demo-my-library',
    },
  })

  const favorites = await prisma.shelf.create({
    data: {
      userId: user.id,
      name: 'Favorites',
      size: ShelfSize.M,
      theme: ShelfTheme.LIGHT_OAK,
      sortOrder: 1,
      isPublic: false,
    },
  })

  console.log(`Created shelves: "${myLibrary.name}", "${favorites.name}"`)

  // ─── Books ────────────────────────────────────────────────────────────────────
  type BookInput = {
    title: string
    author: string
    isbn: string
    pageCount: number
    genre: string
    publisher: string
    publishedYear: number
    status: ReadingStatus
    rating: number | null
    percentRead: number
    source: BookSource
    shelfId: string
    language: string
    spineColor: string
    description: string
  }

  const booksData: BookInput[] = [
    // ── My Library shelf (12 books) ─────────────────────────────────────────
    {
      title: 'The Name of the Wind',
      author: 'Patrick Rothfuss',
      isbn: '9780756404741',
      pageCount: 662,
      genre: 'Fantasy',
      publisher: 'DAW Books',
      publishedYear: 2007,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#8B4513',
      description: 'The tale of Kvothe, a magically gifted young man who grows to be a notorious wizard.',
    },
    {
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441013593',
      pageCount: 412,
      genre: 'Science Fiction',
      publisher: 'Ace Books',
      publishedYear: 1965,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#D2691E',
      description: 'Set in the distant future amidst a feudal interstellar society, Dune tells the story of young Paul Atreides.',
    },
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      isbn: '9780593135204',
      pageCount: 476,
      genre: 'Science Fiction',
      publisher: 'Ballantine Books',
      publishedYear: 2021,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.KINDLE,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#1C3A5E',
      description: 'A lone astronaut must save the earth from disaster.',
    },
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '9780735211292',
      pageCount: 320,
      genre: 'Self-Help',
      publisher: 'Avery',
      publishedYear: 2018,
      status: ReadingStatus.READ,
      rating: 4,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#F5C518',
      description: 'An easy and proven way to build good habits and break bad ones.',
    },
    {
      title: 'The Pragmatic Programmer',
      author: 'David Thomas & Andrew Hunt',
      isbn: '9780135957059',
      pageCount: 352,
      genre: 'Technology',
      publisher: 'Addison-Wesley',
      publishedYear: 2019,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#2E4057',
      description: 'Your journey to mastery — the 20th anniversary edition.',
    },
    {
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      isbn: '9780062316097',
      pageCount: 443,
      genre: 'History',
      publisher: 'Harper',
      publishedYear: 2015,
      status: ReadingStatus.READ,
      rating: 4,
      percentRead: 100,
      source: BookSource.GOODREADS,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#C0392B',
      description: 'A brief history of humankind.',
    },
    {
      title: 'The Midnight Library',
      author: 'Matt Haig',
      isbn: '9780525559474',
      pageCount: 288,
      genre: 'Fiction',
      publisher: 'Viking',
      publishedYear: 2020,
      status: ReadingStatus.READING,
      rating: null,
      percentRead: 62,
      source: BookSource.IBOOKS,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#2C3E50',
      description: 'Between life and death there is a library with infinite books.',
    },
    {
      title: 'Educated',
      author: 'Tara Westover',
      isbn: '9780399590504',
      pageCount: 352,
      genre: 'Memoir',
      publisher: 'Random House',
      publishedYear: 2018,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#6C3483',
      description: 'A memoir about a young girl who leaves her survivalist family and goes on to earn a PhD from Cambridge.',
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      pageCount: 464,
      genre: 'Technology',
      publisher: 'Prentice Hall',
      publishedYear: 2008,
      status: ReadingStatus.READ,
      rating: 4,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#17202A',
      description: 'A handbook of agile software craftsmanship.',
    },
    {
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      isbn: '9780062315007',
      pageCount: 208,
      genre: 'Fiction',
      publisher: 'HarperOne',
      publishedYear: 1988,
      status: ReadingStatus.READ,
      rating: 4,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#E67E22',
      description: 'A magical story about following your dreams.',
    },
    {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      isbn: '9780374533557',
      pageCount: 499,
      genre: 'Psychology',
      publisher: 'Farrar, Straus and Giroux',
      publishedYear: 2011,
      status: ReadingStatus.DID_NOT_FINISH,
      rating: 3,
      percentRead: 40,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#27AE60',
      description: 'A groundbreaking tour of the mind and explains the two systems that drive the way we think.',
    },
    {
      title: 'Norwegian Wood',
      author: 'Haruki Murakami',
      isbn: '9780375704024',
      pageCount: 296,
      genre: 'Literary Fiction',
      publisher: 'Vintage International',
      publishedYear: 1987,
      status: ReadingStatus.WANT_TO_READ,
      rating: null,
      percentRead: 0,
      source: BookSource.MANUAL,
      shelfId: myLibrary.id,
      language: 'en',
      spineColor: '#A93226',
      description: 'A nostalgic story of loss and sexuality set in Tokyo.',
    },

    // ── Favorites shelf (8 books) ────────────────────────────────────────────
    {
      title: 'The Lord of the Rings',
      author: 'J.R.R. Tolkien',
      isbn: '9780618640157',
      pageCount: 1178,
      genre: 'Fantasy',
      publisher: 'Houghton Mifflin',
      publishedYear: 1954,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#2E7D32',
      description: 'An epic high-fantasy novel set in Middle-earth.',
    },
    {
      title: 'Harry Potter and the Philosopher\'s Stone',
      author: 'J.K. Rowling',
      isbn: '9780439708180',
      pageCount: 309,
      genre: 'Fantasy',
      publisher: 'Scholastic',
      publishedYear: 1997,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#5D4037',
      description: 'A young boy discovers he is a wizard and attends Hogwarts School of Witchcraft and Wizardry.',
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '9780451524935',
      pageCount: 328,
      genre: 'Dystopian Fiction',
      publisher: 'Signet Classic',
      publishedYear: 1949,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.GOOGLE_BOOKS,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#263238',
      description: 'A dystopian novel set in a totalitarian society.',
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780061935466',
      pageCount: 336,
      genre: 'Southern Gothic',
      publisher: 'Harper Perennial',
      publishedYear: 1960,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#BF360C',
      description: 'A novel about racial injustice and childhood innocence in the American South.',
    },
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      pageCount: 180,
      genre: 'Literary Fiction',
      publisher: 'Scribner',
      publishedYear: 1925,
      status: ReadingStatus.READ,
      rating: 4,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#1565C0',
      description: 'A classic novel set in the Jazz Age about wealth, love, and the American Dream.',
    },
    {
      title: 'Shoe Dog',
      author: 'Phil Knight',
      isbn: '9781501135927',
      pageCount: 400,
      genre: 'Biography',
      publisher: 'Scribner',
      publishedYear: 2016,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.KINDLE,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#FF6F00',
      description: 'The memoir of Nike founder Phil Knight.',
    },
    {
      title: 'The Power of Now',
      author: 'Eckhart Tolle',
      isbn: '9781577314806',
      pageCount: 229,
      genre: 'Spirituality',
      publisher: 'New World Library',
      publishedYear: 1997,
      status: ReadingStatus.READING,
      rating: null,
      percentRead: 35,
      source: BookSource.IBOOKS,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#558B2F',
      description: 'A guide to spiritual enlightenment.',
    },
    {
      title: 'Meditations',
      author: 'Marcus Aurelius',
      isbn: '9780812968255',
      pageCount: 254,
      genre: 'Philosophy',
      publisher: 'Modern Library',
      publishedYear: 180,
      status: ReadingStatus.READ,
      rating: 5,
      percentRead: 100,
      source: BookSource.MANUAL,
      shelfId: favorites.id,
      language: 'en',
      spineColor: '#4A235A',
      description: 'Personal writings of Roman Emperor Marcus Aurelius on Stoic philosophy.',
    },
  ]

  const createdBooks = await Promise.all(
    booksData.map((book, index) =>
      prisma.book.create({
        data: {
          userId: user.id,
          shelfId: book.shelfId,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          pageCount: book.pageCount,
          genre: book.genre,
          publisher: book.publisher,
          publishedYear: book.publishedYear,
          description: book.description,
          status: book.status,
          rating: book.rating,
          percentRead: book.percentRead,
          source: book.source,
          language: book.language,
          spineColor: book.spineColor,
          positionOnShelf: index,
          finishedAt:
            book.status === ReadingStatus.READ
              ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
              : null,
          startedAt:
            book.status !== ReadingStatus.WANT_TO_READ
              ? new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000)
              : null,
        },
      })
    )
  )

  console.log(`Created ${createdBooks.length} books`)

  // ─── Book Notes ───────────────────────────────────────────────────────────────
  const duneBook = createdBooks.find((b) => b.title === 'Dune')
  const atomicHabitsBook = createdBooks.find((b) => b.title === 'Atomic Habits')
  const projectHailMaryBook = createdBooks.find((b) => b.title === 'Project Hail Mary')

  if (duneBook) {
    await prisma.bookNote.createMany({
      data: [
        {
          bookId: duneBook.id,
          userId: user.id,
          content: 'The ecology of Arrakis is fascinating — Herbert clearly did deep research into desert ecosystems.',
          pageNumber: 87,
        },
        {
          bookId: duneBook.id,
          userId: user.id,
          content: '"I must not fear. Fear is the mind-killer." — One of the most quoted lines ever, and it earns it.',
          pageNumber: 8,
          highlight: 'I must not fear. Fear is the mind-killer.',
        },
      ],
    })
  }

  if (atomicHabitsBook) {
    await prisma.bookNote.createMany({
      data: [
        {
          bookId: atomicHabitsBook.id,
          userId: user.id,
          content: 'The 1% improvement compounding concept is the key insight. Small changes, massive results over time.',
          pageNumber: 15,
        },
        {
          bookId: atomicHabitsBook.id,
          userId: user.id,
          content: 'Habit stacking: "After [CURRENT HABIT], I will [NEW HABIT]." Simple but effective framework.',
          pageNumber: 74,
          highlight: 'After [CURRENT HABIT], I will [NEW HABIT].',
        },
      ],
    })
  }

  if (projectHailMaryBook) {
    await prisma.bookNote.createMany({
      data: [
        {
          bookId: projectHailMaryBook.id,
          userId: user.id,
          content: 'The science is explained so clearly without dumbing it down. Rocky is already my favourite fictional character.',
          pageNumber: 203,
        },
      ],
    })
  }

  console.log('Created book notes')

  // ─── Notebook ─────────────────────────────────────────────────────────────────
  const notebook = await prisma.notebook.create({
    data: {
      userId: user.id,
    },
  })

  await prisma.notebookEntry.createMany({
    data: [
      {
        notebookId: notebook.id,
        bookId: duneBook?.id ?? null,
        content:
          'Key theme in Dune: resource scarcity as the root of all political conflict. Spice = oil. Paul\'s journey mirrors real-world colonial narratives.',
      },
      {
        notebookId: notebook.id,
        content:
          'Reading goal for the year: 24 books. Currently on track at 2 books per month. Focus on finishing unfinished reads before buying new ones.',
      },
    ],
  })

  await prisma.dictionaryWord.createMany({
    data: [
      {
        notebookId: notebook.id,
        word: 'melange',
        definition: 'A mixture or assortment; in Dune, the spice produced only on Arrakis.',
        bookId: duneBook?.id ?? null,
        pageNumber: 12,
      },
      {
        notebookId: notebook.id,
        word: 'prescience',
        definition: 'The fact of knowing something before it takes place; foreknowledge.',
        bookId: duneBook?.id ?? null,
        pageNumber: 145,
      },
      {
        notebookId: notebook.id,
        word: 'compounding',
        definition:
          'In personal development: the process by which small, consistent actions accumulate exponential results over time.',
        bookId: atomicHabitsBook?.id ?? null,
        pageNumber: 15,
      },
    ],
  })

  console.log('Created notebook with entries and dictionary words')

  // ─── Wishlist ─────────────────────────────────────────────────────────────────
  await prisma.wishlistItem.createMany({
    data: [
      {
        userId: user.id,
        title: 'The Way of Kings',
        author: 'Brandon Sanderson',
        isbn: '9780765326355',
        notes: 'First in the Stormlight Archive series. ~1000 pages, need a free weekend.',
        priority: 1,
      },
      {
        userId: user.id,
        title: 'Gödel, Escher, Bach',
        author: 'Douglas Hofstadter',
        isbn: '9780465026562',
        notes: 'Dense but supposed to be mind-expanding. Buy physical copy only.',
        priority: 2,
      },
      {
        userId: user.id,
        title: 'The Expanse: Leviathan Wakes',
        author: 'James S.A. Corey',
        isbn: '9780316129084',
        notes: 'Loved the show, time to read the books.',
        priority: 1,
      },
      {
        userId: user.id,
        title: 'Range',
        author: 'David Epstein',
        isbn: '9780735214484',
        notes: 'Recommended by multiple people. About why generalists thrive in a specialist world.',
        priority: 3,
      },
    ],
  })

  console.log('Created wishlist items')

  // ─── Reading Sessions ─────────────────────────────────────────────────────────
  const readBooks = createdBooks.filter((b) => b.status === ReadingStatus.READ)
  const sessionData = readBooks.slice(0, 5).flatMap((book) => {
    const sessionCount = Math.floor(Math.random() * 4) + 2
    return Array.from({ length: sessionCount }, (_, i) => {
      const startOffset = (sessionCount - i) * 3 * 24 * 60 * 60 * 1000
      const startedAt = new Date(Date.now() - startOffset)
      const durationMs = (Math.floor(Math.random() * 60) + 20) * 60 * 1000
      return {
        userId: user.id,
        bookId: book.id,
        startedAt,
        endedAt: new Date(startedAt.getTime() + durationMs),
        pagesRead: Math.floor(Math.random() * 40) + 10,
      }
    })
  })

  await prisma.readingSession.createMany({ data: sessionData })

  console.log(`Created ${sessionData.length} reading sessions`)

  // ─── Reading Streak ───────────────────────────────────────────────────────────
  await prisma.readingStreak.create({
    data: {
      userId: user.id,
      currentStreak: 7,
      longestStreak: 21,
      lastReadDate: new Date(),
      totalDaysRead: 84,
    },
  })

  console.log('Created reading streak')

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
