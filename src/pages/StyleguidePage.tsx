import { useState, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Countdown } from '../components/ui/Countdown'
import { LiveDot } from '../components/ui/LiveDot'
import { LotCard } from '../components/ui/LotCard'
import { PriceTicker } from '../components/ui/PriceTicker'
import { StatusChip, type LotStatus } from '../components/ui/StatusChip'

const COLORS: { name: string; token: string; className: string }[] = [
  { name: 'Brand', token: '#00D3CC', className: 'bg-brand' },
  { name: 'Brand ink', token: '#00807A', className: 'bg-brand-ink' },
  { name: 'Brand tint', token: '#E6FAF9', className: 'bg-brand-tint' },
  { name: 'Ink', token: '#0A0A0A', className: 'bg-ink' },
  { name: 'Ink 2', token: '#6E6E73', className: 'bg-ink-2' },
  { name: 'Line', token: '#E8E8ED', className: 'bg-line' },
  { name: 'Surface', token: '#FFFFFF', className: 'bg-surface border border-line' },
  { name: 'Surface 2', token: '#F5F5F7', className: 'bg-surface-2' },
  { name: 'Danger', token: '#D92D20', className: 'bg-danger' },
  { name: 'Warning', token: '#B54708', className: 'bg-warning' },
]

const STATUSES: LotStatus[] = ['winning', 'outbid', 'sold', 'live']

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-12">
      <h2 className="text-h2 tracking-tight text-ink">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export function StyleguidePage() {
  const [mockBid, setMockBid] = useState(950)
  const [watched, setWatched] = useState(false)

  const soon = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString()

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
      <p className="text-small font-semibold text-brand-ink">Flip design system</p>
      <h1 className="mt-1 text-h1 tracking-tight text-ink">Styleguide</h1>
      <p className="mt-2 max-w-[560px] text-body text-ink-2">
        Tokens and primitives from the frontend design brief — an IKEA catalogue feel with Apple's calm, and a live
        auction underneath. Teal is the only accent colour.
      </p>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {COLORS.map((c) => (
            <div key={c.name}>
              <div className={`h-20 rounded-card ${c.className}`} />
              <p className="mt-2 text-small font-semibold text-ink">{c.name}</p>
              <p className="text-micro text-ink-2">{c.token}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <p className="text-display tracking-tight text-ink">Display 56/60</p>
          <p className="text-h1 tracking-tight text-ink">Heading 1 · 40</p>
          <p className="text-h2 tracking-tight text-ink">Heading 2 · 28</p>
          <p className="text-h3 tracking-tight text-ink">Heading 3 · 20</p>
          <p className="text-body text-ink">Body 16 — regular weight, 1.5 line height, for descriptions and copy.</p>
          <p className="text-small text-ink-2">Small 14 — metadata, labels, timestamps.</p>
          <p className="text-micro text-ink-2">Micro 12 — fine print.</p>
          <p className="text-h3 tabular-nums text-ink">R 1 250.00 — tabular nums keep prices from jittering</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Browse lots</Button>
          <Button variant="outline">See what's live</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" size="lg">
            Place bid
          </Button>
          <Button variant="primary" disabled>
            Sold
          </Button>
        </div>
      </Section>

      <Section title="Status chips & live indicator">
        <div className="flex flex-wrap items-center gap-3">
          {STATUSES.map((s) => (
            <StatusChip key={s} status={s} />
          ))}
          <span className="flex items-center gap-2 text-small text-ink-2">
            <LiveDot /> Live now
          </span>
        </div>
      </Section>

      <Section title="Countdown">
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-small text-ink-2">2 days out</p>
            <Countdown endsAt={soon(2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)} className="text-h3" />
          </div>
          <div>
            <p className="text-small text-ink-2">14 minutes out</p>
            <Countdown endsAt={soon(14 * 60 * 1000 + 22 * 1000)} className="text-h3" />
          </div>
          <div>
            <p className="text-small text-ink-2">Final 60 seconds</p>
            <Countdown endsAt={soon(45 * 1000)} className="text-h3" />
          </div>
        </div>
      </Section>

      <Section title="Price ticker">
        <div className="flex items-center gap-6">
          <PriceTicker amount={mockBid} className="text-display" />
          <Button variant="outline" onClick={() => setMockBid((v) => v + 50)}>
            Simulate a new bid
          </Button>
        </div>
      </Section>

      <Section title="Lot card">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <LotCard
            href="#"
            title="Mid-century oak dining table"
            condition="Good"
            location="Cape Town"
            currentBid={mockBid}
            bidCount={3}
            endsAt={soon(2 * 24 * 60 * 60 * 1000)}
            status="winning"
            watched={watched}
            onToggleWatch={() => setWatched((w) => !w)}
            onQuickBid={() => setMockBid((v) => v + 50)}
          />
          <LotCard
            href="#"
            title="Retro fridge, works great, some rust on the door"
            condition="Fair"
            location="Johannesburg"
            currentBid={620}
            bidCount={7}
            endsAt={soon(45 * 60 * 1000)}
            status="outbid"
            onQuickBid={() => {}}
          />
          <LotCard
            href="#"
            title="Set of 6 dining chairs"
            condition="Like new"
            location="Durban"
            currentBid={1250}
            bidCount={12}
            endsAt={soon(20 * 1000)}
            status="live"
            onQuickBid={() => {}}
          />
          <LotCard
            href="#"
            title="Antique writing desk"
            condition="Good"
            location="Pretoria"
            currentBid={0}
            soldPrice={2100}
            bidCount={9}
            endsAt={soon(0)}
            status="sold"
          />
        </div>
      </Section>
    </div>
  )
}
