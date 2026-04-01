import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts'
import { formatNumber, formatPct } from '../utils/format'

const MANUAL_COLOR = '#F97316'
const EXPECTED_COLOR = '#6B7280'

export default function CategoryChart({ data, onCategoryClick }) {
  const sorted = [...data].sort((a, b) => b.OrderLines - a.OrderLines)

  const chartData = sorted.map(d => ({
    label: d.CategoryLabel,
    OrderLines: d.OrderLines,
    PctOfTotal: d.PctOfTotal,
    type: d.Type,
    code: d.CategoryCode,
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        What is driving price adjustments?
      </h2>
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 42)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 120, bottom: 5, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis
            dataKey="label"
            type="category"
            width={180}
            tick={{ fontSize: 12, fill: '#334155' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'OrderLines') return [formatNumber(value), 'Order lines']
              return [value, name]
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar
            dataKey="OrderLines"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={(entry) => onCategoryClick?.(entry.code)}
          >
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.type === 'Manual' ? MANUAL_COLOR : EXPECTED_COLOR}
              />
            ))}
            <LabelList
              dataKey={(entry) => `${formatNumber(entry.OrderLines)}  (${formatPct(entry.PctOfTotal)})`}
              position="right"
              style={{ fontSize: 11, fill: '#475569' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: MANUAL_COLOR }} />
          Manual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: EXPECTED_COLOR }} />
          Expected
        </span>
        <span className="ml-auto text-slate-400">Click a bar to see customer details</span>
      </div>
    </div>
  )
}
