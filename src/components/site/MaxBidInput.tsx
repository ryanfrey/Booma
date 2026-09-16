import { formatZARWhole } from '../../lib/currency'

export function MaxBidInput({
  minBid,
  value,
  onChange,
}: {
  minBid: number
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label htmlFor="max-bid" className="text-small font-semibold text-ink">
        Max bid
      </label>
      <p className="mt-0.5 text-small text-ink-2">We'll bid for you up to this amount.</p>
      <input
        id="max-bid"
        type="number"
        inputMode="numeric"
        min={minBid}
        placeholder={`${formatZARWhole(minBid)} or more`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-card border border-line px-3 text-body text-ink focus-visible:outline-2 focus-visible:outline-brand"
      />
    </div>
  )
}
