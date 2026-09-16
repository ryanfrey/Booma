const formatter = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })
const wholeFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
})

export function formatZAR(amount: number) {
  return formatter.format(amount)
}

// Whole-rand display format used across lot cards and the bid panel — "R 1 250".
export function formatZARWhole(amount: number) {
  return wholeFormatter.format(amount)
}
