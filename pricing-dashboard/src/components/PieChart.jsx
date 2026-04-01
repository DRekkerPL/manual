import { PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatNumber } from '../utils/format'

const MANUAL_COLOR = '#F97316'
const EXPECTED_COLOR = '#6B7280'

export default function PieChart({ categories }) {
  const manual = categories
    .filter(c => c.Type === 'Manual')
    .reduce((s, c) => s + c.OrderLines, 0)
  const expected = categories
    .filter(c => c.Type === 'Expected')
    .reduce((s, c) => s + c.OrderLines, 0)

  const data = [
    { name: 'Manual', value: manual, color: MANUAL_COLOR },
    { name: 'Expected', value: expected, color: EXPECTED_COLOR },
  ]

  const total = manual + expected

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">
        Expected vs Manual adjustments
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) => `${name}: ${((value / total) * 100).toFixed(1)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [formatNumber(value) + ' lines', '']} />
          <Legend />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  )
}
