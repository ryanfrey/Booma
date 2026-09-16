import { X } from 'lucide-react'
import { CATEGORIES, CONDITIONS } from '../../lib/mockData'
import { Button } from '../ui/Button'

export interface LotFilters {
  categories: string[]
  conditions: string[]
  auctionType: 'all' | 'timed' | 'live'
  minPrice: string
  maxPrice: string
  endingWithin: 'any' | '1h' | '24h' | '3d' | '7d'
}

export const DEFAULT_FILTERS: LotFilters = {
  categories: [],
  conditions: [],
  auctionType: 'all',
  minPrice: '',
  maxPrice: '',
  endingWithin: 'any',
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div>
      <p className="text-small font-semibold text-ink">{label}</p>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-small text-ink-2">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(toggle(selected, option))}
              className="h-4 w-4 accent-brand"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}

function FilterFields({ filters, onChange }: { filters: LotFilters; onChange: (next: LotFilters) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-small font-semibold text-ink">Auction type</p>
        <div className="mt-3 flex flex-col gap-2">
          {(['all', 'timed', 'live'] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-small text-ink-2">
              <input
                type="radio"
                name="auction-type"
                checked={filters.auctionType === type}
                onChange={() => onChange({ ...filters, auctionType: type })}
                className="h-4 w-4 accent-brand"
              />
              {type === 'all' ? 'All auctions' : type === 'timed' ? 'Timed' : 'Live'}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <CheckboxGroup
          label="Category"
          options={CATEGORIES}
          selected={filters.categories}
          onChange={(categories) => onChange({ ...filters, categories })}
        />
      </div>

      <div className="border-t border-line pt-6">
        <CheckboxGroup
          label="Condition"
          options={CONDITIONS}
          selected={filters.conditions}
          onChange={(conditions) => onChange({ ...filters, conditions })}
        />
      </div>

      <div className="border-t border-line pt-6">
        <p className="text-small font-semibold text-ink">Price range (ZAR)</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            className="h-10 w-full rounded-card border border-line px-3 text-small text-ink"
          />
          <span className="text-ink-2">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className="h-10 w-full rounded-card border border-line px-3 text-small text-ink"
          />
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <label className="text-small font-semibold text-ink" htmlFor="ending-within">
          Ending within
        </label>
        <select
          id="ending-within"
          value={filters.endingWithin}
          onChange={(e) => onChange({ ...filters, endingWithin: e.target.value as LotFilters['endingWithin'] })}
          className="mt-3 h-10 w-full rounded-card border border-line px-3 text-small text-ink"
        >
          <option value="any">Any time</option>
          <option value="1h">1 hour</option>
          <option value="24h">24 hours</option>
          <option value="3d">3 days</option>
          <option value="7d">7 days</option>
        </select>
      </div>
    </div>
  )
}

interface FilterPanelProps {
  filters: LotFilters
  onChange: (next: LotFilters) => void
  /** Present only for the mobile bottom-sheet presentation. */
  onClose?: () => void
}

export function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.conditions.length > 0 ||
    filters.auctionType !== 'all' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.endingWithin !== 'any'

  // Mobile bottom sheet.
  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <button
          type="button"
          aria-label="Close filters"
          onClick={onClose}
          className="absolute inset-0 bg-ink/40"
        />
        <div className="relative max-h-[85vh] overflow-y-auto rounded-t-tile bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 tracking-tight text-ink">Filters</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="text-ink-2">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div className="mt-5">
            <FilterFields filters={filters} onChange={onChange} />
          </div>
          <div className="mt-6 flex gap-3">
            {hasActiveFilters && (
              <Button variant="outline" className="flex-1" onClick={() => onChange(DEFAULT_FILTERS)}>
                Clear all
              </Button>
            )}
            <Button variant="primary" className="flex-1" onClick={onClose}>
              Show results
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop sidebar.
  return (
    <div className="w-[260px] shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 tracking-tight text-ink">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-small font-semibold text-brand-ink"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="mt-5">
        <FilterFields filters={filters} onChange={onChange} />
      </div>
    </div>
  )
}
