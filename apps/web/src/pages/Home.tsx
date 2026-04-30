import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-ink text-slate-100 font-sans">

      {/* NAV */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-ink-light max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-shelf-500 flex items-center justify-center">
            <svg aria-hidden="true" className="h-5 w-5 text-shelf-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 2h4v20H4zM10 2h4v20h-4zM16 2h4v20h-4z" />
            </svg>
          </div>
          <span className="text-shelf-100 font-semibold tracking-tight">Virtual Bookshelf</span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/pricing" className="text-slate-400 hover:text-slate-200 transition-colors">
            Pricing
          </Link>
          <Link to="/store" className="text-slate-400 hover:text-slate-200 transition-colors">
            Marketplace
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-slate-400 hover:text-slate-200 transition-colors">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-shelf-500 px-4 py-2 font-medium text-shelf-50 hover:bg-shelf-600 transition-colors">
                Start free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              to="/dashboard"
              className="rounded-lg bg-shelf-500 px-4 py-2 font-medium text-shelf-50 hover:bg-shelf-600 transition-colors"
            >
              Open my shelf
            </Link>
          </SignedIn>
        </nav>
      </header>

      {/* HERO */}
      <section className="px-6 pt-24 pb-28 text-center max-w-4xl mx-auto">
        <p className="text-shelf-300 text-sm font-medium tracking-widest uppercase mb-5">
          Your library, in three dimensions
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight text-slate-100 mb-6">
          Your library deserves<br />to be seen.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Virtual Bookshelf turns your book collection into a stunning 3D shelf — every spine sized to match the real thing. Import from Goodreads, Kindle, Google Play Books, and more. Then share it with the world.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto rounded-xl bg-shelf-500 px-8 py-4 text-lg font-semibold text-shelf-50 hover:bg-shelf-600 transition-colors shadow-lg">
                Start your shelf — it's free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto rounded-xl bg-shelf-500 px-8 py-4 text-lg font-semibold text-shelf-50 hover:bg-shelf-600 transition-colors shadow-lg"
            >
              Open my shelf
            </Link>
          </SignedIn>
          <Link
            to="/s/example"
            className="w-full sm:w-auto rounded-xl border border-ink-light px-8 py-4 text-lg font-semibold text-slate-300 hover:border-shelf-500 hover:text-slate-100 transition-colors"
          >
            See an example shelf
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">No credit card needed. Free shelf ready in two minutes.</p>
      </section>

      {/* SOCIAL PROOF BAR */}
      <div className="border-y border-ink-light py-5 px-6">
        <p className="text-center text-slate-500 text-sm">
          Join{' '}
          <span className="text-slate-300 font-semibold">10,000+ readers</span>
          {' '}who display their libraries in 3D &mdash; from Goodreads, Kindle, and BookTok, all in one place.
        </p>
      </div>

      {/* FEATURE CARDS */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-100 mb-4">
          Everything your reading life needs.
        </h2>
        <p className="text-center text-slate-400 mb-14 max-w-xl mx-auto">
          One place for every book you own, every book you've read, and every book you want to read next.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="rounded-xl bg-ink-light border border-ink-light p-7 hover:border-shelf-500 transition-colors">
            <div className="w-10 h-10 bg-shelf-500/10 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-shelf-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-100 mb-2 text-lg">A shelf that actually looks like a shelf.</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Books sized by page count. Four themes: dark walnut, light oak, white minimalist, vintage. Your collection rendered in photorealistic 3D — smooth pan and zoom, just like browsing the stacks.
            </p>
          </div>

          <div className="rounded-xl bg-ink-light border border-ink-light p-7 hover:border-shelf-500 transition-colors">
            <div className="w-10 h-10 bg-shelf-500/10 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-shelf-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-100 mb-2 text-lg">All your books live here now.</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Import from Goodreads, Kindle, Google Play Books, Apple Books, Kobo, or scan a cover with your phone camera. Every format, one shelf. Your reading history finally in one place.
            </p>
          </div>

          <div className="rounded-xl bg-ink-light border border-ink-light p-7 hover:border-shelf-500 transition-colors">
            <div className="w-10 h-10 bg-shelf-500/10 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-shelf-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-100 mb-2 text-lg">Share your shelf. Show your taste.</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every account gets a beautiful public shelf URL. Link it in your bio, share it on bookstagram, let people browse your full collection without logging in. Your reading life, made visible.
            </p>
          </div>

        </div>
      </section>

      {/* IMPORT SOURCES */}
      <div className="px-6 py-14 bg-ink-light border-y border-ink-light">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Works with everywhere you already read.</h2>
          <p className="text-slate-400 mb-8">Import your existing library in minutes. We handle the format.</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {[
              'Goodreads CSV',
              'Kindle',
              'Google Play Books',
              'Apple Books',
              'Kobo',
              'EPUB upload',
              'PDF upload',
              'Camera scan',
              'Manual entry',
            ].map((source) => (
              <span
                key={source}
                className="px-4 py-2 bg-ink border border-ink-light rounded-full text-slate-300"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CAMERA SCAN */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-shelf-300 text-sm font-medium tracking-widest uppercase mb-3">Camera scan</p>
            <h2 className="text-3xl font-bold text-slate-100 mb-5">
              Add a book in three seconds.<br />No typing required.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Spot a book you want to add? Just point your phone at it. Our AI reads the cover or spine, finds the metadata, and drops it on your shelf. You just confirm. Works for single books and full shelf scans alike.
            </p>
            <ol className="space-y-4">
              {[
                { step: '1', text: 'Tap the camera icon in the app' },
                { step: '2', text: 'Point your phone at any book cover or spine — even a full shelf photo' },
                { step: '3', text: 'Confirm the match and it\'s on your shelf' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="w-7 h-7 rounded-full bg-shelf-500/20 text-shelf-300 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <span className="text-slate-300 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl bg-ink-light border border-ink-light aspect-[4/5] flex items-center justify-center">
            <p className="text-slate-600 text-sm">Camera scan demo</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-6 py-20 bg-ink-light border-y border-ink-light" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-100 mb-3">
            Pick the shelf that fits your collection.
          </h2>
          <p className="text-center text-slate-400 mb-12">Start free. Upgrade when you're ready.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="rounded-2xl bg-ink border border-ink-light p-6 flex flex-col">
              <div className="mb-6">
                <p className="text-slate-400 text-sm font-medium mb-1">Free</p>
                <p className="text-3xl font-bold text-slate-100">$0</p>
                <p className="text-slate-500 text-sm mt-1">forever</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-400 flex-1 mb-6 leading-relaxed">
                <li>1 small shelf (50 books)</li>
                <li>Manual book entry</li>
                <li>Public shelf URL</li>
                <li>Basic sorting</li>
              </ul>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full border border-ink-light hover:border-shelf-500 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    Start free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="block text-center border border-ink-light hover:border-shelf-500 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Go to dashboard
                </Link>
              </SignedIn>
            </div>

            <div className="rounded-2xl bg-ink border border-ink-light p-6 flex flex-col">
              <div className="mb-6">
                <p className="text-slate-400 text-sm font-medium mb-1">Reader</p>
                <p className="text-3xl font-bold text-slate-100">$3.99</p>
                <p className="text-slate-500 text-sm mt-1">per month</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-400 flex-1 mb-6 leading-relaxed">
                <li>3 shelves (150 books)</li>
                <li>All import sources</li>
                <li>Reading stats and charts</li>
                <li>Reading streak tracker</li>
                <li>Camera scan (single book)</li>
              </ul>
              <Link to="/pricing" className="block text-center border border-ink-light hover:border-shelf-500 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Start Reader
              </Link>
            </div>

            <div className="rounded-2xl bg-ink border-2 border-shelf-500 p-6 flex flex-col relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-shelf-500 text-shelf-50 text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </span>
              <div className="mb-6">
                <p className="text-shelf-300 text-sm font-medium mb-1">Collector</p>
                <p className="text-3xl font-bold text-slate-100">$7.99</p>
                <p className="text-slate-500 text-sm mt-1">per month</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300 flex-1 mb-6 leading-relaxed">
                <li>Unlimited shelves</li>
                <li>Everything in Reader</li>
                <li>Shelf themes</li>
                <li>Vocabulary notebook</li>
                <li>Book recommendations</li>
                <li>Marketplace access</li>
                <li>Full shelf camera scan</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-shelf-500 hover:bg-shelf-600 text-shelf-50 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                Start Collector
              </Link>
            </div>

            <div className="rounded-2xl bg-ink border border-ink-light p-6 flex flex-col">
              <div className="mb-6">
                <p className="text-slate-400 text-sm font-medium mb-1">Bibliophile</p>
                <p className="text-3xl font-bold text-slate-100">$12.99</p>
                <p className="text-slate-500 text-sm mt-1">per month</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-400 flex-1 mb-6 leading-relaxed">
                <li>Everything in Collector</li>
                <li>Priority AI enrichment</li>
                <li>CSV export</li>
                <li>Early access to features</li>
                <li>10% marketplace commission</li>
              </ul>
              <Link to="/pricing" className="block text-center border border-ink-light hover:border-shelf-500 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Start Bibliophile
              </Link>
            </div>

          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Annual plans available — save up to 17%.{' '}
            <Link to="/pricing" className="text-shelf-300 hover:text-shelf-200 transition-colors">
              See full pricing details
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-100 mb-12">
          Questions readers ask before their first shelf.
        </h2>
        <div className="space-y-8">
          {[
            {
              q: 'What exactly is Virtual Bookshelf?',
              a: "It's a web app (and installable PWA) that lets you build a photorealistic 3D version of your personal library. Add books from any source and we render them as an accurate 3D shelf — books sized by page count, spines visible, browseable. Think of it as the home your reading life has always deserved.",
            },
            {
              q: 'Can I import my Goodreads library?',
              a: 'Yes. Export your Goodreads data as a CSV — it takes about a minute — and we\'ll import your entire reading history including read dates, ratings, and shelves. Collector and Bibliophile plans support direct CSV import with automatic shelf mapping.',
            },
            {
              q: 'Is my reading data private?',
              a: "Yes. Your shelf is private by default. You choose when to make it public and exactly what's visible. We don't sell your reading data.",
            },
            {
              q: 'Does it work offline?',
              a: "Virtual Bookshelf is a Progressive Web App, which means you can install it to your phone's home screen. Your shelf is cached for offline viewing. Adding and syncing new books requires an internet connection.",
            },
            {
              q: 'How does the camera scan work?',
              a: 'Open the app on your phone, tap the camera icon, and point it at a book cover or spine. Our AI identifies the title and author, pulls in the full metadata, and shows you a confirmation screen. Tap confirm and it\'s on your shelf. Collector and Bibliophile plans can scan an entire physical shelf in one photo.',
            },
            {
              q: 'Can I buy and sell books through the app?',
              a: 'Yes. Reader plan and above can browse the marketplace. Collector and Bibliophile users can list physical books for sale. Buyers pay securely through the app; sellers receive weekly payouts via Stripe.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-ink-light pb-8">
              <h3 className="text-slate-100 font-semibold mb-2">{q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="px-6 py-24 text-center border-t border-ink-light bg-ink-light">
        <h2 className="text-4xl font-bold text-slate-100 mb-4">Your shelf is waiting.</h2>
        <p className="text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
          Start building your virtual library today — free, no credit card needed, ready in two minutes.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-xl bg-shelf-500 px-10 py-4 text-lg font-semibold text-shelf-50 hover:bg-shelf-600 transition-colors shadow-lg">
              Start your shelf — it's free
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            to="/dashboard"
            className="inline-block rounded-xl bg-shelf-500 px-10 py-4 text-lg font-semibold text-shelf-50 hover:bg-shelf-600 transition-colors shadow-lg"
          >
            Open my shelf
          </Link>
        </SignedIn>
        <p className="mt-5 text-sm text-slate-500">
          Already a reader?{' '}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-slate-400 hover:text-slate-300 transition-colors underline underline-offset-2">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </p>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-10 border-t border-ink-light">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-shelf-500 flex items-center justify-center">
              <svg aria-hidden="true" className="h-3.5 w-3.5 text-shelf-50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 2h4v20H4zM10 2h4v20h-4zM16 2h4v20h-4z" />
              </svg>
            </div>
            <span className="text-shelf-300/70 font-semibold">Virtual Bookshelf</span>
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
            <Link to="/store" className="hover:text-slate-300 transition-colors">Marketplace</Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
          <span>2026 Virtual Bookshelf</span>
        </div>
      </footer>

    </div>
  )
}
