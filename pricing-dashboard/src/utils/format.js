const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

/** Convert MonthKey like 202404 to "Apr 2024" */
export function formatMonthKey(monthKey) {
  const str = String(monthKey)
  const year = str.slice(0, 4)
  const monthIdx = parseInt(str.slice(4), 10) - 1
  return `${MONTH_NAMES[monthIdx]} ${year}`
}

/** Format EUR with thousands separator: €1,234,567 */
export function formatEUR(value) {
  if (value == null || isNaN(value)) return '€0'
  return '€' + Math.round(value).toLocaleString('en-US')
}

/** Format percentage to 1 decimal: 12.3% */
export function formatPct(value) {
  if (value == null || isNaN(value)) return '0.0%'
  return value.toFixed(1) + '%'
}

/** Format large numbers with thousands separator */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return '0'
  return Math.round(value).toLocaleString('en-US')
}
