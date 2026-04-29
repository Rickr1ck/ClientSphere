// src/pages/dashboard/TicketsPieChart.tsx
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TicketStatusData } from '@/types/dashboard.types'

interface TicketsPieChartProps {
  data: TicketStatusData[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: item.payload?.color ?? '#888780' }}
        />
        <span className="font-medium text-gray-900">{item.name}</span>
      </div>
      <p className="text-gray-600 mt-0.5">
        {item.value} ticket{item.value !== 1 ? 's' : ''}{' '}
        <span className="text-gray-400">
          ({item.payload?.percent
            ? `${Math.round(item.payload.percent * 100)}%`
            : ''})
        </span>
      </p>
    </div>
  )
}

// Custom label rendered inside each slice if large enough
function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) {
  if (percent < 0.08) return null  // skip tiny slices
  const RADIAN = Math.PI / 180
  const r  = innerRadius + (outerRadius - innerRadius) * 0.55
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y}
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: 11, fill: '#fff', fontWeight: 500 }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

export default function TicketsPieChart({ data }: TicketsPieChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div>
      <div className="flex flex-col gap-2">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={88}
              paddingAngle={2}
              dataKey="count"
              nameKey="status"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Custom legend with counts */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
          {data.map(item => (
            <div key={item.status} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-xs text-gray-600 flex-1 truncate">{item.status}</span>
              <span className="text-xs font-medium text-gray-900 tabular-nums">
                {item.count}
              </span>
            </div>
          ))}
          <div className="col-span-2 mt-1 pt-1.5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Total</span>
            <span className="text-xs font-semibold text-gray-900 tabular-nums">{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}