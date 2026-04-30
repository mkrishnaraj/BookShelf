// Floating feedback button — bottom right corner
// Click opens a modal with 1-5 star rating and a text area
// Submits to POST /api/v1/feedback
// Shows success toast on submit
// Position: fixed bottom-6 right-6, z-50

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient as api } from '../../lib/api'

interface FeedbackPayload {
  rating: number
  message: string
  page?: string
}

function submitFeedback(payload: FeedbackPayload) {
  return api.post('/api/v1/feedback', payload)
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setRating(0)
        setMessage('')
      }, 2000)
    },
  })

  function handleOpen() {
    setOpen(true)
    setSubmitted(false)
    setRating(0)
    setMessage('')
  }

  function handleClose() {
    if (mutation.isPending) return
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0 || mutation.isPending) return
    mutation.mutate({
      rating,
      message,
      ...(typeof window !== 'undefined' ? { page: window.location.pathname } : {}),
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') handleClose()
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open feedback form"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-shelf-600 text-white shadow-lg transition-colors hover:bg-shelf-500 focus:outline-none focus:ring-2 focus:ring-shelf-400 focus:ring-offset-2 focus:ring-offset-ink"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          className="fixed inset-0 z-50 flex items-end justify-end p-6"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative w-full max-w-sm rounded-2xl bg-ink-800 p-6 shadow-2xl ring-1 ring-white/10">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-green-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className="text-base font-medium text-slate-100">Thanks for your feedback!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2
                  id="feedback-title"
                  className="mb-4 text-base font-semibold text-slate-100"
                >
                  How is Virtual Bookshelf working for you?
                </h2>

                {/* Star rating */}
                <fieldset className="mb-4">
                  <legend className="mb-2 text-sm text-slate-400">Rating</legend>
                  <div className="flex gap-1" role="group" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                        aria-pressed={rating === star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-shelf-400 focus:ring-offset-1 focus:ring-offset-ink-800 rounded"
                      >
                        <span
                          className={
                            star <= (hovered || rating)
                              ? 'text-amber-400'
                              : 'text-slate-600'
                          }
                          aria-hidden="true"
                        >
                          &#9733;
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Message */}
                <label htmlFor="feedback-message" className="mb-1 block text-sm text-slate-400">
                  Tell us more (optional)
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="What could we improve?"
                  className="mb-4 w-full resize-none rounded-lg bg-ink-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 ring-1 ring-white/10 focus:outline-none focus:ring-shelf-500"
                />

                {/* Error */}
                {mutation.isError && (
                  <p role="alert" className="mb-3 text-xs text-red-400">
                    Something went wrong — please try again.
                  </p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={mutation.isPending}
                    className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-shelf-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rating === 0 || mutation.isPending}
                    className="rounded-lg bg-shelf-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-shelf-500 focus:outline-none focus:ring-2 focus:ring-shelf-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mutation.isPending ? 'Sending...' : 'Send feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
