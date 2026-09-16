import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeftIcon, HomeIcon, SearchIcon, TagIcon } from './icons'

const LISTING_DETAIL_RE = /^\/listings\/[^/]+$/

export function AppShell() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isPush = LISTING_DETAIL_RE.test(pathname) || pathname === '/sell/new'
  const title = LISTING_DETAIL_RE.test(pathname) ? 'Listing' : pathname === '/sell/new' ? 'New listing' : ''
  const sellTarget = profile?.is_seller ? '/sell/listings' : '/sell'
  const sellActive = pathname.startsWith('/sell')

  return (
    <div className="app-shell">
      <header className="top-bar">
        {isPush ? (
          <button type="button" className="btn-icon top-bar-back" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeftIcon />
          </button>
        ) : (
          <Link to="/" className="top-bar-brand">
            Booma
          </Link>
        )}
        {title && <span className="top-bar-title">{title}</span>}
      </header>

      <main className={`app-main${isPush ? ' no-bottom-nav' : ''}`}>
        <Outlet />
      </main>

      {!isPush && (
        <nav className="bottom-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <HomeIcon />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/listings"
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <SearchIcon />
            <span>Browse</span>
          </NavLink>
          <NavLink to={sellTarget} className={`bottom-nav-item${sellActive ? ' active' : ''}`}>
            <TagIcon />
            <span>Sell</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
