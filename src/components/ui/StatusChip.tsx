import { LiveDot } from './LiveDot'

export type LotStatus = 'winning' | 'outbid' | 'sold' | 'live'

const LABELS: Record<LotStatus, string> = {
  winning: "You're winning",
  outbid: 'Outbid',
  sold: 'Sold',
  live: 'Live',
}

const STYLES: Record<LotStatus, string> = {
  winning: 'bg-brand-tint text-brand-ink',
  outbid: 'bg-danger-tint text-danger',
  sold: 'bg-surface-2 text-ink-2',
  live: 'bg-brand-tint text-brand-ink',
}

export function StatusChip({ status, className = '' }: { status: LotStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-small font-semibold ${STYLES[status]} ${className}`}
    >
      {status === 'live' && <LiveDot />}
      {LABELS[status]}
    </span>
  )
}
