import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!PAYSTACK_SECRET_KEY) {
    return jsonResponse({ error: 'Paystack is not configured' }, 500)
  }

  // Gated behind a signed-in user (verify_jwt) purely so this isn't an open
  // Paystack-reference-status oracle — the reference itself is the real key.
  if (!req.headers.get('Authorization')) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  let body: { reference?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.reference) {
    return jsonResponse({ error: 'reference is required' }, 400)
  }

  const paystackResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(body.reference)}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
  )
  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status) {
    return jsonResponse({ error: paystackData.message ?? 'Could not verify this authorization' }, 502)
  }

  const tx = paystackData.data
  if (tx.status !== 'success' || !tx.authorization?.authorization_code) {
    return jsonResponse({ error: 'Card authorization was not successful', status: tx.status }, 422)
  }

  return jsonResponse(
    {
      status: tx.status,
      amount: tx.amount / 100,
      reference: tx.reference,
      authorization_code: tx.authorization.authorization_code as string,
    },
    200,
  )
})
