import { CreditCard, Gavel, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { LotCard } from '../components/ui/LotCard'
import { useWatchlist } from '../hooks/useWatchlist'
import { MOCK_LOTS, ROOMS, UPCOMING_AUCTIONS } from '../lib/mockData'

const HOW_IT_WORKS = [
  { icon: UserPlus, title: 'Register', body: 'Create an account and verify your phone and card — takes a minute.' },
  { icon: Gavel, title: 'Bid', body: 'Place a bid or set a max and let Booma bid for you, up to your limit.' },
  { icon: CreditCard, title: 'Pay & collect', body: "Win the lot, pay securely, then collect or arrange delivery." },
]

function SectionHeading({ title, action }: { title: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-h2 tracking-tight text-ink">{title}</h2>
      {action && (
        <Link to={action.href} className="text-small font-semibold text-brand-ink">
          {action.label}
        </Link>
      )}
    </div>
  )
}

export function HomePage() {
  const { isWatched, toggle } = useWatchlist()

  const liveLots = MOCK_LOTS.filter((lot) => lot.status === 'live')
  const endingSoon = [...MOCK_LOTS]
    .filter((lot) => lot.status !== 'sold')
    .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
    .slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-h1 tracking-tight text-ink sm:text-display">Great homes, sold live.</h1>
            <p className="mt-4 max-w-[440px] text-body text-ink-2">
              Booma is a live auction for household goods — real bids, real countdowns, real people clearing out
              real homes across South Africa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/listings">
                <Button variant="primary" size="lg">
                  Browse lots
                </Button>
              </Link>
              <Link to="/listings?live=1">
                <Button variant="outline" size="lg">
                  See what's live
                </Button>
              </Link>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-tile bg-surface-2" aria-hidden="true" />
        </div>
      </section>

      {/* Live now */}
      {liveLots.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
          <SectionHeading title="Live now" action={{ label: 'See all live', href: '/listings?live=1' }} />
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {liveLots.map((lot) => (
              <LotCard
                key={lot.id}
                href={`/listings/${lot.id}`}
                title={lot.title}
                condition={lot.condition}
                location={lot.location}
                currentBid={lot.currentBid}
                bidCount={lot.bidCount}
                endsAt={lot.endsAt}
                status={lot.status}
                lotProgress={`Lot ${lot.lotNumber} of ${lot.lotsInAuction}`}
                viewerCount={lot.viewerCount}
                watched={isWatched(lot.id)}
                onToggleWatch={() => toggle(lot.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Shop by room */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <SectionHeading title="Shop by room" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ROOMS.map((room) => (
            <Link
              key={room}
              to={`/listings?room=${encodeURIComponent(room)}`}
              className="group relative flex aspect-square items-end overflow-hidden rounded-tile bg-surface-2 p-4"
            >
              <span className="text-h3 font-semibold tracking-tight text-ink">{room}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ending soon */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <SectionHeading title="Ending soon" action={{ label: 'See all', href: '/listings' }} />
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {endingSoon.map((lot) => (
            <LotCard
              key={lot.id}
              href={`/listings/${lot.id}`}
              title={lot.title}
              condition={lot.condition}
              location={lot.location}
              currentBid={lot.currentBid}
              bidCount={lot.bidCount}
              endsAt={lot.endsAt}
              status={lot.status}
              watched={isWatched(lot.id)}
              onToggleWatch={() => toggle(lot.id)}
              onQuickBid={() => {}}
            />
          ))}
        </div>
      </section>

      {/* Upcoming auctions */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <SectionHeading title="Upcoming auctions" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {UPCOMING_AUCTIONS.map((auction) => (
            <div key={auction.id} className="rounded-card border border-line p-5">
              <p className="text-small font-semibold text-brand-ink">
                {new Date(auction.startsAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
              </p>
              <h3 className="mt-1 text-h3 tracking-tight text-ink">{auction.title}</h3>
              <p className="mt-1 text-small text-ink-2">{auction.location}</p>
              <p className="text-small text-ink-2">{auction.lotCount} lots</p>
              <Button variant="outline" size="md" className="mt-4">
                Remind me
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* How Booma works */}
      <section id="how-it-works" className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <SectionHeading title="How Booma works" />
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.title}>
              <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-brand-tint text-brand-ink">
                <step.icon size={22} strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 text-h3 tracking-tight text-ink">{step.title}</h3>
              <p className="mt-1 text-body text-ink-2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
