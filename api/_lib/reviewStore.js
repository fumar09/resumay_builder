import { BlobPreconditionFailedError, get, put } from '@vercel/blob'

const REVIEW_BLOB_PATH = 'resumay/reviews-state.json'
const MAX_WRITE_ATTEMPTS = 3

const defaultReviewState = () => ({
  version: 1,
  approved: [],
  pending: [],
})

export function isReviewStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function clampScore(value) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? Math.round(value) : 0))
}

function sanitizeText(value, fallback = '', maxLength = 280) {
  const normalized = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : fallback
  return normalized.slice(0, maxLength) || fallback
}

function sanitizeReview(review, status = 'pending') {
  return {
    id: sanitizeText(review.id, `review-${Date.now()}`, 120),
    name: sanitizeText(review.name, 'Anonymous', 80),
    role: sanitizeText(review.role, 'Job seeker', 120),
    board: sanitizeText(review.board, 'ResuMay!', 120),
    scoreBefore: clampScore(Number(review.scoreBefore)),
    scoreAfter: clampScore(Number(review.scoreAfter)),
    outcome: sanitizeText(review.outcome, 'Shared a ResuMay result', 160),
    quote: sanitizeText(review.quote, '', 600),
    status: status === 'approved' ? 'approved' : 'pending',
    submittedAt: sanitizeText(review.submittedAt, new Date().toISOString(), 80),
  }
}

function sanitizeReviewArray(items, status) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => sanitizeReview(item, status))
    .filter((item) => item.quote)
}

function sanitizeReviewState(value) {
  return {
    version: 1,
    approved: sanitizeReviewArray(value?.approved, 'approved'),
    pending: sanitizeReviewArray(value?.pending, 'pending'),
  }
}

async function readReviewState() {
  if (!isReviewStoreConfigured()) {
    return {
      state: defaultReviewState(),
      etag: null,
    }
  }

  const blobResult = await get(REVIEW_BLOB_PATH, {
    access: 'private',
    useCache: false,
  })

  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    return {
      state: defaultReviewState(),
      etag: null,
    }
  }

  const text = await new Response(blobResult.stream).text()

  try {
    return {
      state: sanitizeReviewState(JSON.parse(text)),
      etag: blobResult.blob.etag,
    }
  } catch {
    return {
      state: defaultReviewState(),
      etag: blobResult.blob.etag,
    }
  }
}

async function writeReviewState(state, etag) {
  const payload = JSON.stringify(sanitizeReviewState(state), null, 2)
  const options = {
    access: 'private',
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: 'application/json',
    ...(etag ? { ifMatch: etag } : {}),
  }

  return put(REVIEW_BLOB_PATH, payload, options)
}

export async function getApprovedReviews() {
  const { state } = await readReviewState()
  return state.approved
}

export async function getPendingReviews() {
  const { state } = await readReviewState()
  return state.pending
}

export async function submitReview(reviewInput) {
  if (!isReviewStoreConfigured()) {
    throw new Error('Review store is not configured.')
  }

  const submittedReview = sanitizeReview(
    {
      ...reviewInput,
      id: reviewInput?.id ?? `review-${Date.now()}`,
      submittedAt: reviewInput?.submittedAt ?? new Date().toISOString(),
    },
    'pending'
  )

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { state, etag } = await readReviewState()

    try {
      await writeReviewState(
        {
          ...state,
          pending: [submittedReview, ...state.pending],
        },
        etag
      )

      return submittedReview
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError && attempt < MAX_WRITE_ATTEMPTS - 1) {
        continue
      }

      throw error
    }
  }

  throw new Error('Review submission could not be completed.')
}

export async function moderateReview(reviewId, action) {
  if (!isReviewStoreConfigured()) {
    throw new Error('Review store is not configured.')
  }

  const normalizedAction = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : ''

  if (!normalizedAction) {
    throw new Error('Invalid moderation action.')
  }

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { state, etag } = await readReviewState()
    const reviewIndex = state.pending.findIndex((review) => review.id === reviewId)

    if (reviewIndex === -1) {
      return null
    }

    const pendingReview = state.pending[reviewIndex]
    const nextPending = state.pending.filter((review) => review.id !== reviewId)
    const nextApproved =
      normalizedAction === 'approve'
        ? [{ ...pendingReview, status: 'approved' }, ...state.approved]
        : state.approved

    try {
      await writeReviewState(
        {
          ...state,
          pending: nextPending,
          approved: nextApproved,
        },
        etag
      )

      return normalizedAction === 'approve' ? { ...pendingReview, status: 'approved' } : pendingReview
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError && attempt < MAX_WRITE_ATTEMPTS - 1) {
        continue
      }

      throw error
    }
  }

  throw new Error('Review moderation could not be completed.')
}
