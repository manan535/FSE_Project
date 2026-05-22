import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useWorkspace } from '../../context/WorkspaceContext';

const ACTION_COLORS = {
  LOGIN: 'bg-emerald-100 text-emerald-700',
  LOGOUT: 'bg-slate-100 text-slate-700',
  USER_CREATED: 'bg-blue-100 text-blue-700',
  USER_DELETED: 'bg-red-100 text-red-700',
  SETTINGS_UPDATE: 'bg-amber-100 text-amber-700',
  PASSWORD_CHANGE: 'bg-orange-100 text-orange-700',
  ROLE_UPDATE: 'bg-purple-100 text-purple-700',
  API_ACCESS: 'bg-cyan-100 text-cyan-700',
  PROJECT_CREATED: 'bg-indigo-100 text-indigo-700',
  PROJECT_UPDATED: 'bg-violet-100 text-violet-700',
  PROJECT_DELETED: 'bg-rose-100 text-rose-700',
  TASK_CREATED: 'bg-teal-100 text-teal-700',
  TASK_UPDATED: 'bg-sky-100 text-sky-700',
  TASK_DELETED: 'bg-pink-100 text-pink-700',
  MEMBER_ADDED: 'bg-lime-100 text-lime-700',
  MEMBER_REMOVED: 'bg-fuchsia-100 text-fuchsia-700',
};

const ALL_ACTIONS = Object.keys(ACTION_COLORS);

const formatDate = (d) => new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let s = 0; const step = Math.ceil(value / 60);
    const t = setInterval(() => { s += step; if (s >= value) { setDisplay(value); clearInterval(t); } else setDisplay(s); }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display}</span>;
};

const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -3 }}
    className="relative group overflow-hidden bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-5 hover:border-gray-700 transition-all">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity ${color}`} />
    <div className="flex items-center gap-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color} bg-opacity-10 text-xl`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white"><AnimatedNumber value={value} /></p>
      </div>
    </div>
  </motion.div>
);

const AuditLogs = () => {
  const { currentWorkspace } = useWorkspace();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalLogs: 0, todayLogs: 0, uniqueUsersLast7Days: 0, mostCommonAction: 'N/A' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    setLoading(true); setError(null); setAccessDenied(false);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const [logsRes, statsRes] = await Promise.all([
        axios.get(`/api/admin/audit-logs?${params}`),
        axios.get('/api/admin/audit-logs/stats')
      ]);
      setLogs(logsRes.data.logs);
      setPagination(logsRes.data.pagination);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 403) { setAccessDenied(true); }
      else setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally { setLoading(false); }
  }, [currentWorkspace?._id, page, search, actionFilter, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await axios.get(`/api/admin/audit-logs/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'audit-logs.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  const resetFilters = () => { setSearch(''); setActionFilter(''); setStartDate(''); setEndDate(''); setPage(1); };

  if (accessDenied) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-32">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
      <p className="text-gray-400 text-center max-w-sm">Only workspace admins can view audit logs.</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Activity Logs</h1>
            <p className="text-gray-400 mt-1">Track every action across your workspace</p>
          </div>
          {!loading && !error && (
            <div className="flex gap-2 self-start">
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export CSV
              </motion.button>
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={fetchLogs}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                Refresh
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gray-800" /><div className="space-y-2 flex-1"><div className="h-3 bg-gray-800 rounded w-2/3" /><div className="h-6 bg-gray-700 rounded w-1/2" /></div></div></div>)}
            </div>
            <div className="animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-6 h-96" />
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Failed to load activity logs</h3>
            <p className="text-gray-400 text-sm mb-5">{error}</p>
            <button onClick={fetchLogs} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">Try Again</button>
          </motion.div>
        ) : (
          <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="📋" label="Total Activities" value={stats.totalLogs} color="bg-indigo-500" delay={0} />
              <StatCard icon="📅" label="Today" value={stats.todayLogs} color="bg-emerald-500" delay={0.05} />
              <StatCard icon="👥" label="Active Users (7d)" value={stats.uniqueUsersLast7Days} color="bg-violet-500" delay={0.1} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                whileHover={{ y: -3 }}
                className="relative group overflow-hidden bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-5 hover:border-gray-700 transition-all">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity bg-amber-500" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 bg-opacity-10 text-xl">🔥</div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Top Action</p>
                    <p className="text-sm font-bold text-white mt-1">{stats.mostCommonAction?.replace(/_/g, ' ') || 'N/A'}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  <input type="text" placeholder="Search activities..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all" />
                </div>
                <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none">
                  <option value="">All Actions</option>
                  {ALL_ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
                  className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none" />
                <div className="flex gap-2">
                  <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
                    className="flex-1 px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none" />
                  {(search || actionFilter || startDate || endDate) && (
                    <button onClick={resetFilters} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-300 border border-gray-700 rounded-xl hover:bg-gray-800/50 transition-colors" title="Clear filters">✕</button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 overflow-hidden">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 flex items-center justify-center mb-5">
                    <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">No activity found</h3>
                  <p className="text-gray-400 text-sm">Try adjusting your filters or check back later.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto audit-table-scroll">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800/60">
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">IP Address</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Device</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/30">
                        {logs.map((log, i) => (
                          <motion.tr key={log._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {log.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{log.userId?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500 truncate">{log.userId?.email || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                                {log.action?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4"><p className="text-sm text-gray-400 max-w-xs truncate">{log.description}</p></td>
                            <td className="px-6 py-4 hidden lg:table-cell"><p className="text-sm text-gray-500 font-mono">{log.ipAddress || '—'}</p></td>
                            <td className="px-6 py-4 hidden xl:table-cell"><p className="text-xs text-gray-400 max-w-[200px] truncate">{log.device || '—'}</p></td>
                            <td className="px-6 py-4"><p className="text-sm text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</p></td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/60">
                    <p className="text-sm text-gray-500">
                      Showing <span className="font-medium">{(pagination.page - 1) * 15 + 1}</span>–<span className="font-medium">{Math.min(pagination.page * 15, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        Previous
                      </button>
                      <span className="text-sm text-gray-500 px-2">{pagination.page} / {pagination.pages}</span>
                      <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogs;
