import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { formatMonthKey, formatPct } from '../utils/format'

export default function TrendChart({ data }) {
  // Exclude current incomplete month (April 2026) and take last 24 months
  const now = new Date()
  const currentMonthKey = now.getFullYear() * 100 + (now.getMonth() + 1)

  const filtered = data
    .filter(d => d.MonthKey < currentMonthKey)
    .sort((a, b) => a.MonthKey - b.MonthKey)
    .slice(-24)

  const avg = filtered.reduce((s, d) => s + d.ManualPct, 0) / filtered.length

  const chartData = filtered.map(d => ({
    month: formatMonthKey(d.MonthKey),
    ManualPct: parseFloat(d.ManualPct.toFixed(1)),
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Share of order lines with a manual price change
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
            angle={-35}
            textAnchor="end"
            height={55}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'auto']}
            width={50}
          />
          <Tooltip
            formatter={(value) => [formatPct(value), 'Manual %']}
            labelStyle={{ fontWeight: 600 }}
          />
          <ReferenceLine
            y={parseFloat(avg.toFixed(1))}
            stroke="#94a3b8"
            strokeDasharray="6 4"
            label={{ value: `Avg ${avg.toFixed(1)}%`, position: 'right', fontSize: 11, fill: '#64748b' }}
          />
          <Line
            type="monotone"
            dataKey="ManualPct"
            stroke="#1B3A6B"
            strokeWidth={2}
            dot={{ r: 3, fill: '#1B3A6B' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
