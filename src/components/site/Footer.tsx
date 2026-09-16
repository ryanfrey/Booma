import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Flip',
    links: [
      { label: 'Browse lots', href: '/listings' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Sell with us', href: '/sell' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Collection & delivery', href: '/#how-it-works' },
      { label: 'Contact', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 max-w-[280px] text-small text-ink-2">Great homes, sold live.</p>
          </div>

          <div className="flex gap-12">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="text-small font-semibold text-ink">{col.heading}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-small text-ink-2 hover:text-brand-ink">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-micro text-ink-2">© {new Date().getFullYear()} Flip. Prices in ZAR.</p>
      </div>
    </footer>
  )
}
