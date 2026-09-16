import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronRightIcon, ListIcon, PlusIcon } from '../components/icons'

interface Bank {
  name: string
  code: string
}

export function SellerOnboardingPage() {
  const { session, profile, refreshProfile } = useAuth()
  const [banks, setBanks] = useState<Bank[]>([])
  const [banksError, setBanksError] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState(profile?.display_name ?? '')
  const [settlementBank, setSettlementBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.functions.invoke<{ banks: Bank[] }>('paystack-banks', { method: 'GET' }).then(({ data, error }) => {
      if (error) {
        setBanksError('Could not load the bank list. Try again shortly.')
        return
      }
      setBanks(data?.banks ?? [])
    })
  }, [])

  if (!session) return <Navigate to="/auth" replace />
  if (profile?.is_seller || done) {
    return (
      <div className="seller-onboarding">
        <h1>You're all set up to sell</h1>
        <p>Payouts go to the bank account you linked, minus Flip's platform fee.</p>
        <div className="quick-actions">
          <Link to="/sell/new" className="quick-action-card">
            <span className="quick-action-icon">
              <PlusIcon />
            </span>
            <span className="quick-action-label">Create a listing</span>
            <ChevronRightIcon className="quick-action-chevron" />
          </Link>
          <Link to="/sell/listings" className="quick-action-card">
            <span className="quick-action-icon">
              <ListIcon />
            </span>
            <span className="quick-action-label">My listings</span>
            <ChevronRightIcon className="quick-action-chevron" />
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error: invokeError } = await supabase.functions.invoke<{
      subaccount_code?: string
      error?: string
    }>('paystack-create-subaccount', {
      body: { business_name: businessName, settlement_bank: settlementBank, account_number: accountNumber },
    })

    setSubmitting(false)

    if (invokeError || !data?.subaccount_code) {
      setError(data?.error ?? invokeError?.message ?? 'Something went wrong setting up payouts.')
      return
    }

    await refreshProfile()
    setDone(true)
  }

  return (
    <div className="seller-onboarding">
      <h1>Set up payouts</h1>
      <p>Link a bank account so we can pay you when your listings sell.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Business or seller name
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </label>

        <label>
          Bank
          <select value={settlementBank} onChange={(e) => setSettlementBank(e.target.value)} required>
            <option value="" disabled>
              {banksError ? 'Unable to load banks' : 'Select your bank'}
            </option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Account number
          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={submitting || !settlementBank}>
          {submitting ? 'Setting up…' : 'Start selling'}
        </button>
      </form>
    </div>
  )
}
