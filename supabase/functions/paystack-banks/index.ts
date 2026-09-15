import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!PAYSTACK_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Paystack is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Supabase's gateway already rejects unauthenticated requests (verify_jwt is on
  // for this function); this is just a cheap defense-in-depth check.
  if (!req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const paystackResponse = await fetch(
    'https://api.paystack.co/bank?country=south%20africa&currency=ZAR',
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
  )
  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status) {
    return new Response(
      JSON.stringify({ error: paystackData.message ?? 'Failed to fetch banks from Paystack' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const banks = (paystackData.data as Array<{ name: string; code: string }>).map((bank) => ({
    name: bank.name,
    code: bank.code,
  }))

  return new Response(JSON.stringify({ banks }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
