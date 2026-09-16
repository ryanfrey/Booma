// Stand-in for booma-logo.png (not supplied to this build) — teal "B", black
// wordmark, same proportions the brief describes. Swap for the real asset
// whenever it's available; nothing else about the header depends on this
// being text vs. an <img>.
export function Logo({ markOnly = false, className = '' }: { markOnly?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center text-h3 font-bold tracking-tight ${className}`}>
      <span className="text-brand">B</span>
      {!markOnly && <span className="text-ink">ooma</span>}
    </span>
  )
}
