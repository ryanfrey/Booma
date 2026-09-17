import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { type FormEvent, type ReactNode, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { formatZARWhole } from '../../lib/currency'
import { getBidBreakdown } from '../../lib/buyersPremium'
import { getNextMinBid } from '../../lib/increments'
import { Button } from '../ui/Button'
import { MaxBidInput } from './MaxBidInput'
import { QuickBidButtons } from './QuickBidButtons'

type Step = 'amount' | 'confirm' | 'placing' | 'success'
type Mode = 'single' | 'max'

function SheetShell({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div className="relative w-full max-w-[420px] rounded-t-tile bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-md sm:rounded-tile sm:pb-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-ink-2 hover:text-ink"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
        {children}
      </div>
    </div>
  )
}

function SignInGate({ onClose, onSignedIn }: { onClose: () => void; onSignedIn: () => void }) {
  const { signIn, signUp } = useAuth()
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = authMode === 'sign-up' ? await signUp(email, password, displayName) : await signIn(email, password)

    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onSignedIn()
  }

  return (
    <SheetShell onClose={onClose}>
      <h2 className="text-h3 tracking-tight text-ink">Sign in to bid</h2>
      <p className="mt-1 text-small text-ink-2">You'll need an account to place a bid on Flip.</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        {authMode === 'sign-up' && (
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="h-11 w-full rounded-card border border-line px-3 text-body text-ink"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 w-full rounded-card border border-line px-3 text-body text-ink"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="h-11 w-full rounded-card border border-line px-3 text-body text-ink"
        />

        {error && <p className="text-small text-danger">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Please wait…' : authMode === 'sign-up' ? 'Sign up' : 'Sign in'}
        </Button>
        <button
          type="button"
          onClick={() => setAuthMode(authMode === 'sign-up' ? 'sign-in' : 'sign-up')}
          className="text-small font-semibold text-brand-ink"
        >
          {authMode === 'sign-up' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </form>
    </SheetShell>
  )
}

export function BidSheet({
  title,
  currentBid,
  onClose,
  onConfirm,
}: {
  title: string
  currentBid: number
  onClose: () => void
  onConfirm: (amount: number) => Promise<{ error?: string }>
}) {
  const { session, profile } = useAuth()
  const minBid = getNextMinBid(currentBid)

  const [step, setStep] = useState<Step>('amount')
  const [mode, setMode] = useState<Mode>('single')
  const [amount, setAmount] = useState(minBid)
  const [maxAmount, setMaxAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!session) {
    return <SignInGate onClose={onClose} onSignedIn={() => setError(null)} />
  }

  if (!profile?.payment_method_verified_at) {
    return (
      <SheetShell onClose={onClose}>
        <h2 className="text-h3 tracking-tight text-ink">Verify your payment method</h2>
        <p className="mt-1 text-small text-ink-2">
          We charge a small R1 fee to confirm your card before you can bid.
        </p>
        <Link to="/account/payment-method" onClick={onClose}>
          <Button variant="primary" className="mt-5 w-full">
            Verify payment method
          </Button>
        </Link>
      </SheetShell>
    )
  }

  const chosenAmount = mode === 'single' ? amount : Number(maxAmount)
  const breakdown = getBidBreakdown(Number.isFinite(chosenAmount) ? chosenAmount : minBid)

  const handleContinue = () => {
    if (mode === 'max' && (!maxAmount || Number(maxAmount) < minBid)) {
      setError(`Enter a max bid of at least ${formatZARWhole(minBid)}`)
      return
    }
    setError(null)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    setStep('placing')
    const result = await onConfirm(chosenAmount)
    if (result.error) {
      setError(result.error)
      setStep('confirm')
      return
    }
    setStep('success')
  }

  return (
    <SheetShell onClose={onClose}>
      {step === 'amount' && (
        <>
          <h2 className="text-h3 tracking-tight text-ink">Bid on {title}</h2>
          <p className="mt-1 text-small text-ink-2">Current bid {formatZARWhole(currentBid)}</p>

          <div className="mt-5 flex rounded-pill bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 rounded-pill py-1.5 text-small font-semibold ${mode === 'single' ? 'bg-surface text-ink shadow-sm' : 'text-ink-2'}`}
            >
              Place a bid
            </button>
            <button
              type="button"
              onClick={() => setMode('max')}
              className={`flex-1 rounded-pill py-1.5 text-small font-semibold ${mode === 'max' ? 'bg-surface text-ink shadow-sm' : 'text-ink-2'}`}
            >
              Set a max bid
            </button>
          </div>

          <div className="mt-5">
            {mode === 'single' ? (
              <QuickBidButtons currentBid={currentBid} selected={amount} onSelect={setAmount} />
            ) : (
              <MaxBidInput minBid={minBid} value={maxAmount} onChange={setMaxAmount} />
            )}
          </div>

          {error && <p className="mt-3 text-small text-danger">{error}</p>}

          <Button variant="primary" className="mt-5 w-full" onClick={handleContinue}>
            Continue
          </Button>
        </>
      )}

      {step === 'confirm' && (
        <>
          <h2 className="text-h3 tracking-tight text-ink">
            {mode === 'max' ? 'Confirm your max bid' : 'Confirm your bid'}
          </h2>

          <div className="mt-5 flex flex-col gap-2 rounded-card bg-surface-2 p-4 text-small">
            <div className="flex justify-between">
              <span className="text-ink-2">{mode === 'max' ? 'Max bid' : 'Bid amount'}</span>
              <span className="font-semibold tabular-nums text-ink">{formatZARWhole(breakdown.bidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-2">Buyer's premium (10%)</span>
              <span className="tabular-nums text-ink">{formatZARWhole(breakdown.premium)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-2">VAT on premium (15%)</span>
              <span className="tabular-nums text-ink">{formatZARWhole(breakdown.vat)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-line pt-2 font-semibold">
              <span className="text-ink">You'll pay approx.</span>
              <span className="tabular-nums text-ink">{formatZARWhole(breakdown.total)}</span>
            </div>
          </div>
          <p className="mt-2 text-micro text-ink-2">Estimated only — final fees are confirmed at checkout.</p>

          {error && <p className="mt-3 text-small text-danger">{error}</p>}

          {mode === 'max' && (
            <p className="mt-3 text-small text-ink-2">
              We'll bid for you automatically, one increment at a time, up to this amount.
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('amount')}>
              Back
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </>
      )}

      {step === 'placing' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-body text-ink-2">Placing your bid…</p>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-h3 tracking-tight text-ink">
            {mode === 'max' ? 'Your max bid is set' : "You're the highest bidder"}
          </p>
          <p className="text-small text-ink-2">
            {mode === 'max'
              ? `We'll bid for you up to ${formatZARWhole(chosenAmount)}.`
              : `Your bid of ${formatZARWhole(chosenAmount)} is in.`}
          </p>
          <Button variant="primary" className="mt-4 w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </SheetShell>
  )
}
