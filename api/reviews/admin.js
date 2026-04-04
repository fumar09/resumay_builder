import { getPendingReviews, isReviewStoreConfigured, moderateReview } from '../_lib/reviewStore.js'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function isAuthorized(request) {
  const expectedToken = process.env.RESUMAY_REVIEW_ADMIN_TOKEN
  const providedToken = request.headers.get('x-resumay-admin-token')

  return Boolean(expectedToken) && providedToken === expectedToken
}

function unauthorizedResponse() {
  return json({ error: 'Unauthorized.' }, 401)
}

export async function GET(request) {
  if (!isReviewStoreConfigured()) {
    return json({ error: 'Review storage is not configured.' }, 503)
  }

  if (!isAuthorized(request)) {
    return unauthorizedResponse()
  }

  try {
    const pendingReviews = await getPendingReviews()
    return json({ pendingReviews })
  } catch {
    return json({ error: 'Pending reviews could not be loaded.' }, 500)
  }
}

export async function POST(request) {
  if (!isReviewStoreConfigured()) {
    return json({ error: 'Review storage is not configured.' }, 503)
  }

  if (!isAuthorized(request)) {
    return unauthorizedResponse()
  }

  let body

  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const reviewId = typeof body?.reviewId === 'string' ? body.reviewId : ''
  const action = typeof body?.action === 'string' ? body.action : ''

  if (!reviewId || !['approve', 'reject'].includes(action)) {
    return json({ error: 'A valid reviewId and moderation action are required.' }, 400)
  }

  try {
    const review = await moderateReview(reviewId, action)

    if (!review) {
      return json({ error: 'Review not found.' }, 404)
    }

    return json({
      review,
      action,
      message: `Review ${action}d successfully.`,
    })
  } catch {
    return json({ error: 'Moderation update failed.' }, 500)
  }
}
