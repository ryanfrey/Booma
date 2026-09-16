import { Outlet } from 'react-router-dom'
import { useWatchlist } from '../../hooks/useWatchlist'
import { MOCK_LOTS } from '../../lib/mockData'
import { Footer } from './Footer'
import { Header } from './Header'

export function SiteLayout() {
  const { count } = useWatchlist()
  const hasLiveLots = MOCK_LOTS.some((lot) => lot.status === 'live')

  return (
    <div className="flex min-h-dvh flex-col">
      <Header watchCount={count} hasLiveLots={hasLiveLots} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
