import { useMemo } from 'react'
import { formatEUR, formatNumber } from '../utils/format'

export default function TopCustomersTable({ customers }) {
  const top5 = useMemo(() => {
    // Aggregate across all manual categories per customer
    const map = {}
    for (const row of customers) {
      const key = row.CustomerNo
      if (!map[key]) {
        map[key] = {
          customerNo: key,
          customerName: row.CustomerName || key,
          orderLines: 0,
          discountEUR: 0,
        }
      }
      map[key].orderLines += row.OrderLines || 0
      map[key].discountEUR += row.DiscountEUR || 0
      // Use name if available from any row
      if (row.CustomerName) map[key].customerName = row.CustomerName
    }
    return Object.values(map)
      .sort((a, b) => b.discountEUR - a.discountEUR)
      .slice(0, 5)
  }, [customers])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">
        Top 5 customers by discount (all manual categories)
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Customer</th>
            <th className="pb-2 font-medium text-right">Lines</th>
            <th className="pb-2 font-medium text-right">Discount</th>
          </tr>
        </thead>
        <tbody>
          {top5.map((row, i) => (
            <tr key={row.customerNo} className="border-b border-slate-50 last:border-0">
              <td className="py-2 text-slate-400">{i + 1}</td>
              <td className="py-2">
                <span className="font-medium text-slate-700">{row.customerName}</span>
                {row.customerName !== row.customerNo && (
                  <span className="ml-2 text-xs text-slate-400">{row.customerNo}</span>
                )}
              </td>
              <td className="py-2 text-right text-slate-600">{formatNumber(row.orderLines)}</td>
              <td className="py-2 text-right text-slate-600">{formatEUR(row.discountEUR)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
