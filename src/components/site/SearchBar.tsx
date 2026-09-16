import { Search } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function SearchBar({ className = '' }: { className?: string }) {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const q = value.trim()
    navigate(q ? `/listings?q=${encodeURIComponent(q)}` : '/listings')
  }

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`} role="search">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-2"
        size={18}
        strokeWidth={1.5}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search sofas, fridges, dining sets…"
        aria-label="Search lots"
        className="h-11 w-full rounded-pill border border-line bg-surface pl-11 pr-4 text-body text-ink placeholder:text-ink-2 focus-visible:outline-2 focus-visible:outline-brand"
      />
    </form>
  )
}
