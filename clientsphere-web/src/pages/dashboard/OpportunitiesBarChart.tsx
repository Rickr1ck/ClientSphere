// src/pages/dashboard/OpportunitiesBarChart.tsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  
} from 'recharts'
import type { MonthlyWonData } from '@/types/dashboard.types'

interface OpportunitiesBarChartProps {
  data?: MonthlyWonData[]
}

// ── Custom tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]?.payload
  const won = payload[0]?.value ?? 0
  const value = item?.value ?? 0

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs"
      style={{ minWidth: 120 }}
    >
      <p className="font-medium text-gray-900 mb-1">{label}</p>

      <p className="text-gray-600">
        Won:{' '}
        <span className="font-semibold text-brand-600">
          {won}
        </span>
      </p>

      {typeof value === 'number' && value > 0 && (
        <p className="text-gray-600">
          Value:{' '}
          <span className="font-semibold text-gray-900">
            {new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(value)}
          </span>
        </p>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function OpportunitiesBarChart({ data }: OpportunitiesBarChartProps) {
  const safeData = Array.isArray(data) ? data : []

  // Empty state (defensive rendering)
  if (safeData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    )
  }

  // Compute max safely
  const maxWon = Math.max(...safeData.map(d => d.won), 1)

  // Proper Y-axis scaling
  const yMax = maxWon > 0 ? Math.ceil(maxWon * 1.2) : 5

  // Highlight only FIRST max occurrence (prevents multi-highlight bug)
  const maxIndex = safeData.findIndex(d => d.won === maxWon)

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-600 flex-shrink-0" />
          Deals won
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={safeData}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          barCategoryGap="35%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.06)"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#888780' }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#888780' }}
            axisLine={false}
            tickLine={false}
            domain={[0, yMax]}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />

          <Bar
            dataKey="won"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {safeData.map((entry, index) => {
              const isMax = index === maxIndex && maxWon > 0

              return (
                <Cell
                  key={entry.month ?? index}
                  fill={isMax ? '#534AB7' : '#AFA9EC'}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}