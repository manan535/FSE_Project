import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import axios from 'axios';
import { useWorkspace } from '../../context/WorkspaceContext';

// ─── Gradient color palettes ───────────────────────────────────────────────────
const PIE_COLORS = ['#10b981', '#6366f1', '#94a3b8'];
const PIE_GRADIENTS = [
  { start: '#34d399', end: '#059669' },
  { start: '#818cf8', end: '#4f46e5' },
  { start: '#cbd5e1', end: '#64748b' }
];

const BAR_GRADIENT = { start: '#818cf8', end: '#6366f1' };
const LINE_COLORS = { tasks: '#6366f1', projects: '#10b981' };

// ─── Animated counter ──────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{display}</span>;
};

// ─── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-2xl border border-gray-700/50">
      {label && <p className="text-gray-400 text-xs font-medium mb-1.5">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color || entry.fill }}>
          {entry.name}: <span className="text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Custom pie label ──────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#64748b" textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central" className="text-xs font-medium">
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
};

// ─── Summary card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative group overflow-hidden bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-5 hover:border-gray-700 transition-all duration-300"
  >
    {/* Decorative gradient blob */}
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500 ${color}`} />

    <div className="flex items-center gap-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color} bg-opacity-10 text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">
          <AnimatedNumber value={value} />
        </p>
      </div>
    </div>
  </motion.div>
);

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20"
  >
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 flex items-center justify-center mb-6">
      <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">No analytics data yet</h3>
    <p className="text-gray-400 text-center max-w-sm">
      Start creating projects and tasks to see your team's performance analytics here.
    </p>
  </motion.div>
);

// ─── Loading skeleton ──────────────────────────────────────────────────────────
const SkeletonCard = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-6 ${className}`}>
    <div className="h-5 bg-gray-700 rounded-lg w-1/3 mb-6" />
    <div className="flex items-center justify-center h-[280px]">
      <div className="w-40 h-40 rounded-full bg-gray-800" />
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-900/40 rounded-2xl border border-gray-800/60 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-800" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-800 rounded w-2/3" />
              <div className="h-6 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <SkeletonCard className="h-[420px]" />
  </div>
);

// ─── Error state ───────────────────────────────────────────────────────────────
const ErrorState = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20"
  >
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center mb-5">
      <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-white mb-1">Failed to load analytics</h3>
    <p className="text-gray-400 text-sm mb-5">{message}</p>
    <button
      onClick={onRetry}
      className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md"
    >
      Try Again
    </button>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════
const Analytics = () => {
  const { currentWorkspace } = useWorkspace();
  const [analytics, setAnalytics] = useState({
    taskDistribution: [],
    teamPerformance: [],
    productivityData: [],
    summary: { totalTasks: 0, totalProjects: 0, completedTasks: 0, activeTasks: 0, completionRate: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/analytics');
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const hasData = analytics.summary.totalTasks > 0 || analytics.summary.totalProjects > 0;

  // ─── SVG gradient definitions (reused across charts) ──────────────────────
  const ChartGradients = () => (
    <defs>
      {PIE_GRADIENTS.map((g, i) => (
        <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={g.start} stopOpacity={1} />
          <stop offset="100%" stopColor={g.end} stopOpacity={1} />
        </linearGradient>
      ))}
      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={BAR_GRADIENT.start} stopOpacity={1} />
        <stop offset="100%" stopColor={BAR_GRADIENT.end} stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="areaGradTasks" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="areaGradProjects" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
      </linearGradient>
    </defs>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics</h1>
            <p className="text-gray-400 mt-1">Track your team&apos;s performance and productivity</p>
          </div>
          {!loading && !error && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={fetchAnalytics}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 self-start"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Refresh
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSkeleton />
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState message={error} onRetry={fetchAnalytics} />
          </motion.div>
        ) : !hasData ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState />
          </motion.div>
        ) : (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* ───── Summary cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard icon="📋" label="Total Tasks" value={analytics.summary.totalTasks} color="bg-indigo-500" delay={0} />
              <SummaryCard icon="📁" label="Projects" value={analytics.summary.totalProjects} color="bg-emerald-500" delay={0.05} />
              <SummaryCard icon="✅" label="Completed" value={analytics.summary.completedTasks} color="bg-green-500" delay={0.1} />
              <SummaryCard icon="📊" label="Completion Rate" value={analytics.summary.completionRate} color="bg-violet-500" delay={0.15} />
            </div>

            {/* ───── Task Distribution + Team Performance ───────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart – Task Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6 hover:border-gray-700 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Task Distribution</h3>
                  <div className="flex items-center gap-3">
                    {analytics.taskDistribution.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-xs text-gray-500 font-medium">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <ChartGradients />
                    <Pie
                      data={analytics.taskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderPieLabel}
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={200}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {analytics.taskDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#pieGrad${index})`}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Bar Chart – Team Performance */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6 hover:border-gray-700 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Team Performance</h3>
                {analytics.teamPerformance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                    <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <p className="text-sm font-medium">No completed tasks assigned yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.teamPerformance} barCategoryGap="25%">
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(name) => name.split(' ')[0]}
                      />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                      <Bar
                        dataKey="completed"
                        fill="url(#barGrad)"
                        radius={[8, 8, 0, 0]}
                        name="Tasks Completed"
                        animationDuration={800}
                        animationBegin={400}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            </div>

            {/* ───── Productivity Trend (Area Chart) ────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6 hover:border-gray-700 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <h3 className="text-lg font-semibold text-white">6-Month Productivity Trend</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1 rounded-full" style={{ background: LINE_COLORS.tasks }} />
                    <span className="text-xs text-gray-500 font-medium">Tasks Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1 rounded-full" style={{ background: LINE_COLORS.projects }} />
                    <span className="text-xs text-gray-500 font-medium">Projects Created</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analytics.productivityData}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke={LINE_COLORS.tasks}
                    strokeWidth={2.5}
                    fill="url(#areaGradTasks)"
                    name="Tasks Completed"
                    animationDuration={1000}
                    animationBegin={500}
                    dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projects"
                    stroke={LINE_COLORS.projects}
                    strokeWidth={2.5}
                    fill="url(#areaGradProjects)"
                    name="Projects Created"
                    animationDuration={1000}
                    animationBegin={700}
                    dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;