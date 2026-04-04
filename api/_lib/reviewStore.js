import { BlobPreconditionFailedError, get, put } from '@vercel/blob'

const REVIEW_BLOB_PATH = 'resumay/reviews-state.json'
const MAX_WRITE_ATTEMPTS = 3
const REVIEW_WALL_RESET_AT = '2026-04-04T06:33:52.668Z'

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

function keepFreshReviews(reviews) {
  const resetTime = Date.parse(REVIEW_WALL_RESET_AT)

  return reviews.filter((review) => {
    const submittedAt = Date.parse(review.submittedAt)

    if (!Number.isFinite(resetTime) || !Number.isFinite(submittedAt)) {
      return false
    }

    return submittedAt >= resetTime
  })
}

function pruneReviewState(state) {
  return {
    version: 1,
    approved: keepFreshReviews(state.approved),
    pending: keepFreshReviews(state.pending),
  }
}

function upgradeReviewState(state) {
  const prunedState = pruneReviewState(state)

  if (!prunedState.pending.length) {
    return prunedState
  }

  const approvedById = new Map(prunedState.approved.map((review) => [review.id, review]))

  for (const pendingReview of prunedState.pending) {
    if (!approvedById.has(pendingReview.id)) {
      approvedById.set(pendingReview.id, { ...pendingReview, status: 'approved' })
    }
  }

  return {
    version: 1,
    approved: [...approvedById.values()],
    pending: [],
  }
}

async function readReviewState() {
  if (!isReviewStoreConfigured()) {
    return {
      state: defaultReviewState(),
      etag: null,
      needsSync: false,
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
      needsSync: false,
    }
  }

  const text = await new Response(blobResult.stream).text()

  try {
    const sanitizedState = sanitizeReviewState(JSON.parse(text))
    const normalizedState = upgradeReviewState(sanitizedState)

    return {
      state: normalizedState,
      etag: blobResult.blob.etag,
      needsSync: JSON.stringify(sanitizedState) !== JSON.stringify(normalizedState),
    }
  } catch {
    return {
      state: defaultReviewState(),
      etag: blobResult.blob.etag,
      needsSync: true,
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
  const { state, etag, needsSync } = await readReviewState()

  if (needsSync && isReviewStoreConfigured()) {
    try {
      await writeReviewState(state, etag)
    } catch {
      // Ignore cleanup failures and still return the filtered review list.
    }
  }

  return state.approved
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
    'approved'
  )

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { state, etag } = await readReviewState()
    const nextState = upgradeReviewState(state)

    try {
      await writeReviewState(
        {
          ...nextState,
          approved: [submittedReview, ...nextState.approved.filter((review) => review.id !== submittedReview.id)],
          pending: [],
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
