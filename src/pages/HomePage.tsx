import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { user, profile, signOut } = useAuth()

  return (
    <div className="home-page">
      <h1>Booma</h1>
      <p>Welcome, {profile?.display_name ?? user?.email}.</p>
      <p>
        <Link to="/listings">Browse live auctions</Link>
      </p>
      <p>
        <Link to="/sell">{profile?.is_seller ? 'Seller payouts' : 'Start selling'}</Link>
      </p>
      {profile?.is_seller && (
        <p>
          <Link to="/sell/new">Create a listing</Link>
        </p>
      )}
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </div>
  )
}
