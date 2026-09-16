export function formatTimeLeft(endsAt: string): string {
  const remainingMs = new Date(endsAt).getTime() - Date.now()
  if (remainingMs <= 0) return 'Ended'

  const totalMinutes = Math.floor(remainingMs / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}
