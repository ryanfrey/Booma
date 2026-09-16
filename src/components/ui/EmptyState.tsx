import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-line px-6 py-16 text-center">
      <Icon className="text-ink-2" size={28} strokeWidth={1.5} />
      <h3 className="text-h3 tracking-tight text-ink">{title}</h3>
      <p className="max-w-[360px] text-body text-ink-2">{message}</p>
      {action}
    </div>
  )
}
