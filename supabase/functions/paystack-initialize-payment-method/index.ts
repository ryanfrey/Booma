import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

// A real, captured R1 charge (not a hold) so a buyer's card is proven chargeable before they're
// allowed to bid at all. Independent of the per-bid preauthorization-hold flow, which still runs
// unchanged on every bid.
const VERIFICATION_AMOUNT_ZAR = 1

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

interface InitializePaymentMethodBody {
  callback_url?: string
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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user?.email) {
    return jsonResponse({ error: 'Not authenticated' }, 401)
  }

  let body: InitializePaymentMethodBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const reference = `booma_verify_${crypto.randomUUID()}`

  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.user.email,
      amount: Math.round(VERIFICATION_AMOUNT_ZAR * 100),
      currency: 'ZAR',
      reference,
      callback_url: body.callback_url,
    }),
  })

  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status) {
    return jsonResponse({ error: paystackData.message ?? 'Paystack could not start the verification charge' }, 502)
  }

  return jsonResponse({ authorization_url: paystackData.data.authorization_url, reference }, 200)
})
