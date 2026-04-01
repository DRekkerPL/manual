import { useMemo } from 'react'
import KpiCard from '../components/KpiCard'
import TrendChart from '../components/TrendChart'
import CategoryChart from '../components/CategoryChart'
import PieChart from '../components/PieChart'
import TopSalespersonsTable from '../components/TopSalespersonsTable'
import TopCustomersTable from '../components/TopCustomersTable'
import { formatEUR, formatNumber, formatPct, formatMonthKey } from '../utils/format'

export default function CountryOverview({ data, country }) {
  const { baseline, categories, customers, salespersons } = data

  const kpis = useMemo(() => {
    const now = new Date()
    const currentMonthKey = now.getFullYear() * 100 + (now.getMonth() + 1)

    const complete = baseline
      .filter(d => d.MonthKey < currentMonthKey)
      .sort((a, b) => a.MonthKey - b.MonthKey)

    const last12 = complete.slice(-12)
    const latestMonth = complete[complete.length - 1]

    const totalDiscount = last12.reduce((s, d) => s + (d.DiscountEUR || 0), 0)
    const totalManualLines = last12.reduce((s, d) => s + (d.ManualLines || 0), 0)
    const latestManualPct = latestMonth?.ManualPct ?? 0
    const latestLabel = latestMonth ? formatMonthKey(latestMonth.MonthKey) : ''

    const avgCostPerOverride = totalManualLines > 0 ? totalDiscount / totalManualLines : 0

    // Top reason: manual category with most order lines
    const manualCategories = categories.filter(c => c.Type === 'Manual')
    const topReason = manualCategories.sort((a, b) => b.OrderLines - a.OrderLines)[0]

    // Top customer: across all manual categories
    const custMap = {}
    for (const row of customers) {
      const key = row.CustomerNo
      if (!custMap[key]) {
        custMap[key] = { name: row.CustomerName || key, discount: 0 }
      }
      custMap[key].discount += row.DiscountEUR || 0
      if (row.CustomerName) custMap[key].name = row.CustomerName
    }
    const topCustomer = Object.values(custMap).sort((a, b) => b.discount - a.discount)[0]

    return {
      latestManualPct,
      latestLabel,
      totalDiscount,
      avgCostPerOverride,
      topReason: topReason?.CategoryLabel ?? '-',
      topReasonLines: topReason?.OrderLines ?? 0,
      topCustomer: topCustomer?.name ?? '-',
      topCustomerDiscount: topCustomer?.discount ?? 0,
    }
  }, [baseline, categories, customers])

  const handleCategoryClick = (categoryCode) => {
    console.log('Navigate to category:', categoryCode)
  }

  return (
    <div className="space-y-6">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <KpiCard
          title="Avg cost per override"
          value={formatEUR(kpis.avgCostPerOverride)}
          subtitle="Last 12 months"
        />
        <KpiCard
          title="Top reason"
          value={kpis.topReason}
          subtitle={formatNumber(kpis.topReasonLines) + ' lines'}
        />
        <KpiCard
          title="Top customer"
          value={kpis.topCustomer}
          subtitle={formatEUR(kpis.topCustomerDiscount)}
        />
      </div>

      {/* Row 2: Pie + Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PieChart categories={categories} />
        <TrendChart data={baseline} />
      </div>

      {/* Row 3: Categories + Top salespersons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryChart data={categories} onCategoryClick={handleCategoryClick} />
        <TopSalespersonsTable salespersons={salespersons} />
      </div>

      {/* Row 4: Top customers full width */}
      <TopCustomersTable customers={customers} />
    </div>
  )
}
