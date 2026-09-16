import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChevronRightIcon, ListIcon, PlusIcon, SearchIcon, TagIcon } from '../components/icons'

export function HomePage() {
  const { user, profile, signOut } = useAuth()

  return (
    <div className="home-page">
      <header className="home-header">
        <p className="home-eyebrow">Welcome back</p>
        <h1>{profile?.display_name ?? user?.email}</h1>
      </header>

      <div className="quick-actions">
        <Link to="/listings" className="quick-action-card">
          <span className="quick-action-icon">
            <SearchIcon />
          </span>
          <span className="quick-action-label">Browse live auctions</span>
          <ChevronRightIcon className="quick-action-chevron" />
        </Link>

        <Link to="/sell" className="quick-action-card">
          <span className="quick-action-icon">
            <TagIcon />
          </span>
          <span className="quick-action-label">{profile?.is_seller ? 'Seller payouts' : 'Start selling'}</span>
          <ChevronRightIcon className="quick-action-chevron" />
        </Link>

        {profile?.is_seller && (
          <>
            <Link to="/sell/listings" className="quick-action-card">
              <span className="quick-action-icon">
                <ListIcon />
              </span>
              <span className="quick-action-label">My listings</span>
              <ChevronRightIcon className="quick-action-chevron" />
            </Link>

            <Link to="/sell/new" className="quick-action-card">
              <span className="quick-action-icon">
                <PlusIcon />
              </span>
              <span className="quick-action-label">Create a listing</span>
              <ChevronRightIcon className="quick-action-chevron" />
            </Link>
          </>
        )}
      </div>

      <button type="button" className="btn btn-ghost btn-block" onClick={signOut}>
        Sign out
      </button>
    </div>
  )
}
