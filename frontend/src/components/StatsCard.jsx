import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const colorMap = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-500/10',
    icon: 'text-primary-600 dark:text-primary-400',
    ring: 'ring-primary-500/20',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20',
  },
  danger: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    icon: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500/20',
  },
};

export default function StatsCard({ title, value, change, trend, icon: Icon, color = 'primary' }) {
  const palette = colorMap[color] || colorMap.primary;

  return (
    <div className="group relative bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 hover:shadow-lg hover:shadow-surface-900/5 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${palette.bg} ring-1 ${palette.ring}`}>
          <Icon className={`w-5 h-5 ${palette.icon}`} />
        </div>
        {trend !== 'neutral' && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg ${
              trend === 'up'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {change}
          </span>
        )}
        {trend === 'neutral' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-surface-500 dark:text-surface-400 px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800">
            <Minus className="w-3.5 h-3.5" />
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{title}</p>
    </div>
  );
}
