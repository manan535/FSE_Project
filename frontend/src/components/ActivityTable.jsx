import { CheckCircle2, Clock, MoreHorizontal } from 'lucide-react';
import { recentActivity } from '../data/mockData';

export default function ActivityTable() {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800">
        <div>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Recent Activity</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Latest actions across your workspace</p>
        </div>
        <button className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-600 dark:hover:text-surface-300 transition-colors cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-800">
              <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Action</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider hidden sm:table-cell">Time</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {recentActivity.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-surface-600 dark:text-surface-300">
                        {item.user.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <span className="font-medium text-surface-900 dark:text-white whitespace-nowrap">
                      {item.user}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-surface-600 dark:text-surface-300 max-w-xs truncate">
                  {item.action}
                </td>
                <td className="px-5 py-3.5 text-surface-500 dark:text-surface-400 whitespace-nowrap hidden sm:table-cell">
                  {item.date}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${
                      item.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {item.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
