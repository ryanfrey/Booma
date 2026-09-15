import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
const CRON_SECRET = Deno.env.get('CRON_SECRET')

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

// Invoked on a schedule (pg_cron + pg_net), not by a signed-in user, so this
// function has verify_jwt off and checks a shared secret instead.
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  if (!PAYSTACK_SECRET_KEY) {
    return jsonResponse({ error: 'Paystack is not configured' }, 500)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error: closeError } = await supabase.rpc('close_ended_auctions')
  if (closeError) {
    return jsonResponse({ error: `close_ended_auctions failed: ${closeError.message}` }, 500)
  }

  // Atomically claim pending payments before calling Paystack, so an overlapping
  // cron run (a slow previous invocation still in flight) can't capture the same
  // payment twice.
  const { data: claimed, error: claimError } = await supabase
    .from('payments')
    .update({ status: 'processing' })
    .eq('status', 'pending')
    .select('id, amount, paystack_reference')

  if (claimError) {
    return jsonResponse({ error: `Failed to claim pending payments: ${claimError.message}` }, 500)
  }

  let captured = 0
  let failed = 0

  for (const payment of claimed ?? []) {
    if (!payment.paystack_reference) {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      failed++
      continue
    }

    try {
      const paystackResponse = await fetch('https://api.paystack.co/preauthorization/capture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: payment.paystack_reference,
          amount: Math.round(payment.amount * 100),
          currency: 'ZAR',
        }),
      })
      const paystackData = await paystackResponse.json()
      const success = paystackResponse.ok && paystackData.status && paystackData.data?.status === 'success'

      await supabase
        .from('payments')
        .update({ status: success ? 'captured' : 'failed' })
        .eq('id', payment.id)

      if (success) captured++
      else failed++
    } catch {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      failed++
    }
  }

  return jsonResponse({ captured, failed, claimed: claimed?.length ?? 0 }, 200)
})
