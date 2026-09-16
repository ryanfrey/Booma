import { ChevronDown, Gavel, LayoutList, LogOut, Plus, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Selling isn't a top-level nav item in the new IA (design brief section
// 3.1 only lists Browse / Live now / Watchlist / account), so the seller
// entry points that used to live on the old Home dashboard hang off this
// menu for now. They'll move into "My Booma" (brief section 3.9) later.
export function AccountMenu() {
  const { session, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!session) {
    return (
      <Link to="/auth" className="text-small font-semibold text-ink hover:text-brand-ink">
        Sign in
      </Link>
    )
  }

  const initial = (profile?.display_name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-pill py-1 pl-1 pr-2 hover:bg-surface-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-brand-tint text-small font-semibold text-brand-ink">
          {initial}
        </span>
        <ChevronDown size={16} strokeWidth={1.5} className="text-ink-2" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded-card border border-line bg-surface py-1 shadow-md"
        >
          <p className="truncate px-3 py-2 text-small text-ink-2">
            Signed in as <span className="font-semibold text-ink">{profile?.display_name}</span>
          </p>
          <div className="border-t border-line" />
          {profile?.is_seller ? (
            <>
              <Link
                to="/sell/listings"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-small text-ink hover:bg-surface-2"
                onClick={() => setOpen(false)}
              >
                <LayoutList size={16} strokeWidth={1.5} /> My listings
              </Link>
              <Link
                to="/sell/new"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-small text-ink hover:bg-surface-2"
                onClick={() => setOpen(false)}
              >
                <Plus size={16} strokeWidth={1.5} /> Create a listing
              </Link>
            </>
          ) : (
            <Link
              to="/sell"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-small text-ink hover:bg-surface-2"
              onClick={() => setOpen(false)}
            >
              <User size={16} strokeWidth={1.5} /> Start selling
            </Link>
          )}
          {profile?.is_admin && (
            <>
              <div className="border-t border-line" />
              <Link
                to="/admin"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-small text-ink hover:bg-surface-2"
                onClick={() => setOpen(false)}
              >
                <Gavel size={16} strokeWidth={1.5} /> Admin
              </Link>
            </>
          )}
          <div className="border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-small text-ink hover:bg-surface-2"
          >
            <LogOut size={16} strokeWidth={1.5} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
