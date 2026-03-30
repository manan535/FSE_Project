import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usageData } from '../data/mockData';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 shadow-xl shadow-surface-900/10 dark:shadow-black/30">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
        {payload[0].value.toLocaleString()} requests
      </p>
      <p className="text-xs text-surface-400 dark:text-surface-500">
        Limit: {payload[1]?.value?.toLocaleString() || '5,000'}
      </p>
    </div>
  );
}

export default function UsageChart() {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">API Usage</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Requests this week
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            <span className="text-surface-500 dark:text-surface-400">Usage</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-surface-300 dark:bg-surface-600" />
            <span className="text-surface-500 dark:text-surface-400">Limit</span>
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={usageData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-surface-100 dark:text-surface-800"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="usage"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#usageGradient)"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: '#6366f1',
                fill: '#fff',
              }}
            />
            <Area
              type="monotone"
              dataKey="limit"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              fill="none"
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
