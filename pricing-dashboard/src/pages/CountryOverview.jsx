import { useMemo } from 'react'
import KpiCard from '../components/KpiCard'
import TrendChart from '../components/TrendChart'
import CategoryChart from '../components/CategoryChart'
import { formatEUR, formatNumber, formatPct, formatMonthKey } from '../utils/format'

export default function CountryOverview({ data, country }) {
  const { baseline, categories } = data

  const kpis = useMemo(() => {
    // Exclude current incomplete month
    const now = new Date()
    const currentMonthKey = now.getFullYear() * 100 + (now.getMonth() + 1)

    const complete = baseline
      .filter(d => d.MonthKey < currentMonthKey)
      .sort((a, b) => a.MonthKey - b.MonthKey)

    // Latest 12 complete months
    const last12 = complete.slice(-12)
    const latestMonth = complete[complete.length - 1]

    const totalLines = last12.reduce((s, d) => s + (d.TotalLines || 0), 0)
    const totalDiscount = last12.reduce((s, d) => s + (d.DiscountEUR || 0), 0)
    const latestManualPct = latestMonth?.ManualPct ?? 0
    const latestLabel = latestMonth ? formatMonthKey(latestMonth.MonthKey) : ''

    return { totalLines, totalDiscount, latestManualPct, latestLabel }
  }, [baseline])

  const handleCategoryClick = (categoryCode) => {
    // Page 2 navigation — to be implemented
    console.log('Navigate to category:', categoryCode)
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Total order lines"
          value={formatNumber(kpis.totalLines)}
          subtitle="Last 12 months"
        />
        <KpiCard
          title="Manual price change rate"
          value={formatPct(kpis.latestManualPct)}
          subtitle={kpis.latestLabel}
        />
        <KpiCard
          title="Total discount given"
          value={formatEUR(kpis.totalDiscount)}
          subtitle="Last 12 months"
        />
      </div>

      {/* Trend Chart */}
      <TrendChart data={baseline} />

      {/* Category Bar Chart */}
      <CategoryChart data={categories} onCategoryClick={handleCategoryClick} />
    </div>
  )
}
