import { Heart, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LiveDot } from '../ui/LiveDot'
import { AccountMenu } from './AccountMenu'
import { Logo } from './Logo'
import { SearchBar } from './SearchBar'

export function Header({ watchCount = 0, hasLiveLots = false }: { watchCount?: number; hasLiveLots?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0">
          <Logo className="hidden sm:block" />
          <Logo markOnly className="sm:hidden" />
        </Link>

        <SearchBar className="mx-2 hidden max-w-[480px] flex-1 md:block" />

        <nav className="ml-auto flex items-center gap-5">
          <Link to="/listings" className="hidden text-small font-semibold text-ink hover:text-brand-ink sm:block">
            Browse
          </Link>
          <Link
            to="/listings?live=1"
            className="hidden items-center gap-1.5 text-small font-semibold text-ink hover:text-brand-ink sm:flex"
          >
            {hasLiveLots ? <LiveDot /> : <Radio size={16} strokeWidth={1.5} />}
            Live now
          </Link>
          <Link to="/listings?watchlist=1" className="relative hidden text-ink hover:text-brand-ink sm:block">
            <Heart size={20} strokeWidth={1.5} />
            {watchCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-brand px-1 text-[10px] font-bold text-ink">
                {watchCount}
              </span>
            )}
          </Link>
          <AccountMenu />
        </nav>
      </div>

      <SearchBar className="border-t border-line px-4 py-2 md:hidden" />
    </header>
  )
}
