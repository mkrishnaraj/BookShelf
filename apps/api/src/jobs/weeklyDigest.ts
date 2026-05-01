import { prisma } from '../lib/prisma'

// Weekly digest: summarise each user's reading stats
// Run this with node-cron or Railway cron job: 0 9 * * 1 (every Monday 9am)
export async function runWeeklyDigest() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const activeUsers = await prisma.user.findMany({
    where: { books: { some: { updatedAt: { gte: oneWeekAgo } } } },
    select: {
      id: true,
      email: true,
      books: {
        where: { status: 'READ', updatedAt: { gte: oneWeekAgo } },
        select: { title: true, author: true, rating: true }
      }
    }
  })

  for (const user of activeUsers) {
    console.log(JSON.stringify({
      type: 'weekly_digest',
      userId: user.id,
      email: user.email,
      booksReadThisWeek: user.books.length,
      books: user.books,
    }))
    // TODO: send email via SendGrid / Resend when email provider is configured
  }

  console.log(`Weekly digest: processed ${activeUsers.length} users`)
}
