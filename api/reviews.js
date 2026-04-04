import { getApprovedReviews, isReviewStoreConfigured, submitReview } from './_lib/reviewStore.js'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET() {
  try {
    const backendConfigured = isReviewStoreConfigured()
    const reviews = backendConfigured ? await getApprovedReviews() : []

    return json({
      reviews,
      backendConfigured,
    })
  } catch {
    return json(
      {
        reviews: [],
        backendConfigured: false,
        error: 'Reviews could not be loaded.',
      },
      500
    )
  }
}

export async function POST(request) {
  if (!isReviewStoreConfigured()) {
    return json(
      {
        error: 'Review storage is not configured.',
        backendConfigured: false,
      },
      503
    )
  }

  let body

  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  if (!body || typeof body.quote !== 'string' || !body.quote.trim()) {
    return json({ error: 'A review quote is required.' }, 400)
  }

  try {
    const review = await submitReview(body)

    return json(
      {
        review,
        backendConfigured: true,
        message: 'Review published successfully.',
      },
      201
    )
  } catch {
    return json({ error: 'Review submission failed.' }, 500)
  }
}
