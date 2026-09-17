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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  if (!PAYSTACK_SECRET_KEY) {
    return jsonResponse({ error: 'Paystack is not configured' }, 500)
  }

  // Supabase's gateway already rejects unauthenticated requests (verify_jwt is on
  // for this function); this is just a cheap defense-in-depth check.
  if (!req.headers.get('Authorization')) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const paystackResponse = await fetch(
    'https://api.paystack.co/bank?country=south%20africa&currency=ZAR',
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
  )
  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status) {
    return jsonResponse({ error: paystackData.message ?? 'Failed to fetch banks from Paystack' }, 502)
  }

  const banks = (paystackData.data as Array<{ name: string; code: string }>).map((bank) => ({
    name: bank.name,
    code: bank.code,
  }))

  return jsonResponse({ banks }, 200)
})
