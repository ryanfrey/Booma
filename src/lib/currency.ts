const formatter = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })

export function formatZAR(amount: number) {
  return formatter.format(amount)
}
