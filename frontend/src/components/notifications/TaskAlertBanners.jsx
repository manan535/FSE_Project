/**
 * Task Alert Banners — Dashboard warning/danger cards
 *
 * Renders glassmorphism alert cards for:
 * - Due Tomorrow tasks (amber/yellow)
 * - Overdue tasks (red/danger)
 *
 * Features:
 * - Auto-loads from NotificationContext
 * - Dismissible (sessionStorage so they don't reappear in same session)
 * - Responsive & mobile-friendly
 * - Framer Motion enter/exit animations
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaExclamationTriangle,
  FaTimesCircle,
  FaTimes,
  FaClock,
  FaFire,
} from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';

// ─── Format due date helper ─────────────────────────────────────────────────────
const formatDueDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ═════════════════════════════════════════════════════════════════════════════════
// TaskAlertBanners Component
// ═════════════════════════════════════════════════════════════════════════════════
const TaskAlertBanners = () => {
  const { taskAlerts } = useNotifications();
  const [dismissedOverdue, setDismissedOverdue] = useState(false);
  const [dismissedDueSoon, setDismissedDueSoon] = useState(false);

  // Restore dismissed state from sessionStorage
  useEffect(() => {
    setDismissedOverdue(sessionStorage.getItem('dismiss-overdue') === 'true');
    setDismissedDueSoon(sessionStorage.getItem('dismiss-due-soon') === 'true');
  }, []);

  const dismissOverdue = () => {
    setDismissedOverdue(true);
    sessionStorage.setItem('dismiss-overdue', 'true');
  };

  const dismissDueSoon = () => {
    setDismissedDueSoon(true);
    sessionStorage.setItem('dismiss-due-soon', 'true');
  };

  const hasOverdue = taskAlerts.overdue.length > 0 && !dismissedOverdue;
  const hasDueSoon = taskAlerts.dueSoon.length > 0 && !dismissedDueSoon;

  if (!hasOverdue && !hasDueSoon) return null;

  return (
    <div className="space-y-4 mb-6">
      <AnimatePresence>
        {/* ─── Overdue Tasks — Red Danger Banner ──────────────────────────────── */}
        {hasOverdue && (
          <motion.div
            key="overdue-banner"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-red-500/30 alert-card-danger"
          >
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-red-900/40 to-rose-950/50 backdrop-blur-xl" />
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-red-500/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <FaFire className="text-red-500 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
                      Overdue Tasks
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                        HIGH PRIORITY
                      </span>
                    </h3>
                    <p className="text-xs text-red-400/80 mt-0.5">
                      {taskAlerts.overdue.length} task{taskAlerts.overdue.length > 1 ? 's' : ''} past deadline
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismissOverdue}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500/60 hover:text-red-400 transition-colors"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {taskAlerts.overdue.slice(0, 5).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between bg-gray-900/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-red-500/20 hover:border-red-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FaTimesCircle className="text-red-500 flex-shrink-0 text-sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {task.project?.name || 'No project'} · Due: {formatDueDate(task.dueDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {task.priority?.toUpperCase()}
                    </span>
                  </div>
                ))}
                {taskAlerts.overdue.length > 5 && (
                  <p className="text-xs text-red-500 font-medium text-center py-1">
                    +{taskAlerts.overdue.length - 5} more overdue tasks
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Due Soon Tasks — Amber Warning Banner ─────────────────────────── */}
        {hasDueSoon && (
          <motion.div
            key="due-soon-banner"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/30 alert-card-warning"
          >
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950/50 via-yellow-950/30 to-orange-950/40 backdrop-blur-xl" />
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-yellow-500/10 rounded-full blur-2xl" />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <FaClock className="text-amber-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-300">
                      Tasks Due Soon
                    </h3>
                    <p className="text-xs text-amber-400/80 mt-0.5">
                      {taskAlerts.dueSoon.length} task{taskAlerts.dueSoon.length > 1 ? 's' : ''} due within 24 hours
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismissDueSoon}
                  className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-500/60 hover:text-amber-400 transition-colors"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {taskAlerts.dueSoon.slice(0, 5).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between bg-gray-900/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FaExclamationTriangle className="text-amber-500 flex-shrink-0 text-sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {task.project?.name || 'No project'} · Due: {formatDueDate(task.dueDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {task.priority?.toUpperCase()}
                    </span>
                  </div>
                ))}
                {taskAlerts.dueSoon.length > 5 && (
                  <p className="text-xs text-amber-600 font-medium text-center py-1">
                    +{taskAlerts.dueSoon.length - 5} more tasks due soon
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskAlertBanners;
