import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

// Called from the browser (cross-origin from the app's own domain to *.supabase.co), so every
// response needs these, and the browser's preflight OPTIONS request needs to be answered before
// it ever reaches Paystack -- without this, supabase.functions.invoke() fails with a generic
// "Failed to send a request to the Edge Function" (the browser blocks the response before the
// JS client ever sees a real HTTP status).
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
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
