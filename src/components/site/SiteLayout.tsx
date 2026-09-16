import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useWatchlist } from '../../hooks/useWatchlist'
import { listUpcomingAuctions } from '../../lib/auctions'
import { Footer } from './Footer'
import { Header } from './Header'

export function SiteLayout() {
  const { count } = useWatchlist()
  const [hasLiveLots, setHasLiveLots] = useState(false)

  useEffect(() => {
    let cancelled = false
    listUpcomingAuctions().then((auctions) => {
      if (!cancelled) setHasLiveLots(auctions.some((a) => a.status === 'live'))
    })
    return () => {
      cancelled = true
    }
  }, [])

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
