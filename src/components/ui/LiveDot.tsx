export function LiveDot({ className = '' }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-2 w-2 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping motion-reduce:animate-none rounded-full bg-brand opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
    </span>
  )
}
