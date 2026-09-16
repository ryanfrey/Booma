export function CategoryChips({
  items,
  active,
  onSelect,
  className = '',
}: {
  items: readonly string[]
  active?: string
  onSelect: (item: string) => void
  className?: string
}) {
  return (
    <div
      className={`no-scrollbar flex gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch] ${className}`}
    >
      {items.map((item) => {
        const isActive = item === active
        return (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            aria-pressed={isActive}
            className={`shrink-0 rounded-pill border px-4 py-1.5 text-small font-medium whitespace-nowrap transition-colors duration-200 ${
              isActive ? 'border-brand bg-brand-tint text-brand-ink' : 'border-line text-ink hover:border-ink'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
