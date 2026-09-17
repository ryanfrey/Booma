import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function PaymentMethodPage() {
  const { session, profile, refreshProfile } = useAuth()
  const [redirecting, setRedirecting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Returning from Paystack's hosted checkout after the R1 verification charge.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference') ?? params.get('trxref')
    if (!reference) return

    const cleanUrl = () => {
      params.delete('reference')
      params.delete('trxref')
      const query = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''))
    }

    setVerifying(true)
    setError(null)

    supabase.functions
      .invoke<{ verified?: boolean; error?: string }>('paystack-verify-payment-method', { body: { reference } })
      .then(async ({ data, error: verifyError }) => {
        if (verifyError || !data?.verified) {
          setError(data?.error ?? verifyError?.message ?? 'Could not verify your card.')
          return
        }
        await refreshProfile()
      })
      .finally(() => {
        setVerifying(false)
        cleanUrl()
      })
    // Only meant to run once, on return from Paystack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!session) return <Navigate to="/auth" replace />

  const handleVerify = async () => {
    setError(null)
    setRedirecting(true)

    const { data, error: initError } = await supabase.functions.invoke<{
      authorization_url?: string
      error?: string
    }>('paystack-initialize-payment-method', {
      body: { callback_url: window.location.origin + window.location.pathname },
    })

    if (initError || !data?.authorization_url) {
      setRedirecting(false)
      setError(data?.error ?? initError?.message ?? 'Could not start card verification.')
      return
    }

    window.location.href = data.authorization_url
  }

  if (profile?.payment_method_verified_at) {
    return (
      <div className="seller-onboarding">
        <h1>Payment method verified</h1>
        <p>
          {profile.payment_method_card_type ?? 'Card'} ending in {profile.payment_method_card_last4 ?? '••••'} is
          on file. You're all set to bid.
        </p>
      </div>
    )
  }

  return (
    <div className="seller-onboarding">
      <h1>Verify your payment method</h1>
      <p>
        Before you can bid, we charge a R1 fee to confirm your card is valid. You'll be redirected to Paystack to
        complete it.
      </p>
      {error && <p className="auth-error">{error}</p>}
      <button type="button" onClick={handleVerify} disabled={redirecting || verifying}>
        {redirecting ? 'Redirecting…' : verifying ? 'Confirming…' : 'Verify payment method (R1)'}
      </button>
    </div>
  )
}
