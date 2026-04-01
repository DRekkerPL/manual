import { useMemo } from 'react'
import { formatEUR, formatNumber } from '../utils/format'

export default function TopSalespersonsTable({ salespersons }) {
  const top5 = useMemo(() => {
    // Aggregate across all manual categories per salesperson
    const map = {}
    for (const row of salespersons) {
      const key = row.Salesperson
      if (!map[key]) {
        map[key] = { salesperson: key, orderLines: 0, discountEUR: 0 }
      }
      map[key].orderLines += row.OrderLines || 0
      map[key].discountEUR += row.DiscountEUR || 0
    }
    return Object.values(map)
      .sort((a, b) => b.discountEUR - a.discountEUR)
      .slice(0, 5)
  }, [salespersons])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">
        Top 5 salespersons by discount
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Salesperson</th>
            <th className="pb-2 font-medium text-right">Lines</th>
            <th className="pb-2 font-medium text-right">Discount</th>
          </tr>
        </thead>
        <tbody>
          {top5.map((row, i) => (
            <tr key={row.salesperson} className="border-b border-slate-50 last:border-0">
              <td className="py-2 text-slate-400">{i + 1}</td>
              <td className="py-2 font-medium text-slate-700">{row.salesperson}</td>
              <td className="py-2 text-right text-slate-600">{formatNumber(row.orderLines)}</td>
              <td className="py-2 text-right text-slate-600">{formatEUR(row.discountEUR)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
