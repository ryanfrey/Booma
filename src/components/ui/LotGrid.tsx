import type { ReactNode } from 'react'

export function LotGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>
}
