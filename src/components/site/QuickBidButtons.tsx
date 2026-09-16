import { getIncrement } from '../../lib/increments'
import { formatZARWhole } from '../../lib/currency'

export function QuickBidButtons({
  currentBid,
  selected,
  onSelect,
}: {
  currentBid: number
  selected: number
  onSelect: (amount: number) => void
}) {
  const increment = getIncrement(currentBid)
  const options = [1, 2, 3].map((multiplier) => currentBid + increment * multiplier)

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((amount, i) => (
        <button
          key={amount}
          type="button"
          onClick={() => onSelect(amount)}
          className={`flex h-11 flex-col items-center justify-center rounded-card border text-small font-semibold transition-colors duration-200 ${
            selected === amount ? 'border-brand bg-brand-tint text-brand-ink' : 'border-line text-ink hover:border-ink'
          }`}
        >
          <span>{formatZARWhole(amount)}</span>
          {i === 0 && <span className="text-micro font-normal text-ink-2">min bid</span>}
        </button>
      ))}
    </div>
  )
}
