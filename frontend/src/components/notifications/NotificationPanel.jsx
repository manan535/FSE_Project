/**
 * Notification Panel — Animated dropdown showing all notifications
 *
 * Features:
 * - Color-coded borders by type (info/warning/danger/success/invitation)
 * - Invitation notifications with Accept/Reject action buttons
 * - Mark as read on click
 * - Delete with hover action
 * - Mark all as read button
 * - Infinite scroll (load more)
 * - Search/filter functionality
 * - Loading skeleton
 * - Empty state
 */

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FaCheckDouble,
  FaTrashAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaBell,
  FaTimes,
  FaUserPlus,
  FaCheck,
} from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

// ─── Type config ────────────────────────────────────────────────────────────────
const typeConfig = {
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/10',
    icon: FaInfoCircle,
    iconColor: 'text-blue-400',
    label: 'Info',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10',
    icon: FaExclamationTriangle,
    iconColor: 'text-amber-400',
    label: 'Warning',
  },
  danger: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/10',
    icon: FaTimesCircle,
    iconColor: 'text-red-400',
    label: 'Danger',
  },
  success: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10',
    icon: FaCheckCircle,
    iconColor: 'text-emerald-400',
    label: 'Success',
  },
};

// Invitation type override — used when category === 'invitation'
const invitationConfig = {
  border: 'border-l-violet-500',
  bg: 'bg-violet-500/10',
  icon: FaUserPlus,
  iconColor: 'text-violet-400',
  label: 'Invitation',
};

// ─── Priority badge ─────────────────────────────────────────────────────────────
const PriorityDot = ({ priority }) => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[priority] || colors.medium}`}
      title={`${priority} priority`}
    />
  );
};

// ─── Time ago helper ────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

// ─── Loading skeleton ───────────────────────────────────────────────────────────
const NotificationSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse flex gap-3 p-3 rounded-xl bg-gray-800/40">
        <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-800 rounded w-full" />
          <div className="h-2.5 bg-gray-800 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Invitation action status badge ─────────────────────────────────────────────
const InvitationStatusBadge = ({ status }) => {
  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        <FaCheckCircle className="text-[10px]" />
        Accepted
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-gray-600/20 text-gray-400 border border-gray-600/20">
        <FaTimesCircle className="text-[10px]" />
        Rejected
      </span>
    );
  }
  return null;
};

// ═════════════════════════════════════════════════════════════════════════════════
// NotificationPanel Component
// ═════════════════════════════════════════════════════════════════════════════════
const NotificationPanel = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    pagination,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    acceptInviteFromNotification,
    rejectInviteFromNotification,
  } = useNotifications();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [processingInvites, setProcessingInvites] = useState({});
  const scrollRef = useRef(null);

  // ─── Infinite scroll handler ────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      loadMore();
    }
  }, [loadMore]);

  // ─── Filter notifications locally ──────────────────────────────────────────
  const filteredNotifications = notifications.filter((n) => {
    let matchesType;
    if (filterType === 'all') {
      matchesType = true;
    } else if (filterType === 'invitation') {
      matchesType = n.category === 'invitation';
    } else {
      matchesType = n.type === filterType && n.category !== 'invitation';
    }
    const matchesSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // ─── Handle accept invitation ──────────────────────────────────────────────
  const handleAcceptInvite = async (e, notificationId) => {
    e.stopPropagation();
    setProcessingInvites((prev) => ({ ...prev, [notificationId]: 'accepting' }));
    try {
      const data = await acceptInviteFromNotification(notificationId);
      // Navigate to the project after a short delay
      if (data?.projectId) {
        setTimeout(() => {
          onClose();
          navigate(`/dashboard/projects/${data.projectId}`);
        }, 1000);
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setProcessingInvites((prev) => ({ ...prev, [notificationId]: null }));
    }
  };

  // ─── Handle reject invitation ──────────────────────────────────────────────
  const handleRejectInvite = async (e, notificationId) => {
    e.stopPropagation();
    setProcessingInvites((prev) => ({ ...prev, [notificationId]: 'rejecting' }));
    try {
      await rejectInviteFromNotification(notificationId);
    } catch (err) {
      // Error handled in context
    } finally {
      setProcessingInvites((prev) => ({ ...prev, [notificationId]: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 mt-2 w-[420px] max-h-[560px] bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/60 flex flex-col overflow-hidden z-50"
      id="notification-panel"
    >
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-800/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-400 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-500 hover:text-primary-400"
                title="Mark all as read"
              >
                <FaCheckDouble className="text-sm" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg hover:bg-gray-800/50 transition-colors ${showFilters ? 'text-primary-400 bg-primary-500/10' : 'text-gray-500'}`}
              title="Filter notifications"
            >
              <FaFilter className="text-sm" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-500 hover:text-gray-300"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* ─── Search & Filter Bar ─────────────────────────────────────────── */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2"
          >
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'invitation', 'info', 'warning', 'danger', 'success'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                    filterType === type
                      ? type === 'invitation'
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-primary-500/20 text-primary-300'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                  }`}
                >
                  {type === 'invitation' ? '📨 Invites' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── Notification List ───────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto notification-scroll"
      >
        {loading && notifications.length === 0 ? (
          <NotificationSkeleton />
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <FaBell className="text-2xl text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">No notifications</p>
            <p className="text-xs text-gray-400 text-center">
              {searchQuery ? 'No results match your search' : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filteredNotifications.map((notification) => {
              const isInvitation = notification.category === 'invitation';
              const config = isInvitation
                ? invitationConfig
                : typeConfig[notification.type] || typeConfig.info;
              const Icon = config.icon;
              const isProcessing = processingInvites[notification._id];
              const isPendingInvitation = isInvitation && notification.actionStatus === 'pending';
              const isActedInvitation = isInvitation && (notification.actionStatus === 'accepted' || notification.actionStatus === 'rejected');

              return (
                <motion.div
                  key={notification._id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`group mx-2 mb-1.5 rounded-xl border-l-4 ${config.border} ${
                    notification.isRead ? 'bg-gray-800/30' : config.bg
                  } hover:bg-gray-800/40 transition-all duration-200 cursor-pointer`}
                  onClick={() => !notification.isRead && !isInvitation && markAsRead(notification._id)}
                >
                  <div className="flex items-start gap-3 p-3.5">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      notification.isRead ? 'bg-gray-800' : config.bg
                    }`}>
                      <Icon className={`text-sm ${notification.isRead && !isInvitation ? 'text-gray-400' : config.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${
                          notification.isRead && !isInvitation ? 'text-gray-500' : 'text-white'
                        }`}>
                          {notification.title}
                        </p>
                        {!isInvitation && <PriorityDot priority={notification.priority} />}
                        {isInvitation && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-violet-500/20 text-violet-300">
                            Invite
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${
                        notification.isRead && !isInvitation ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {notification.message}
                      </p>

                      {/* Invitation action buttons or status badge */}
                      {isPendingInvitation && (
                        <div className="flex items-center gap-2 mt-2.5">
                          <button
                            onClick={(e) => handleAcceptInvite(e, notification._id)}
                            disabled={!!isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing === 'accepting' ? (
                              <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            ) : (
                              <FaCheck className="text-[10px]" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleRejectInvite(e, notification._id)}
                            disabled={!!isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-700/30 text-gray-400 border border-gray-600/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing === 'rejecting' ? (
                              <span className="w-3 h-3 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                            ) : (
                              <FaTimes className="text-[10px]" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}

                      {isActedInvitation && (
                        <div className="mt-2">
                          <InvitationStatusBadge status={notification.actionStatus} />
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Delete button (show on hover) — not for pending invitations */}
                    {!isPendingInvitation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all duration-200"
                        title="Delete"
                      >
                        <FaTrashAlt className="text-xs" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Load more indicator */}
            {pagination.page < pagination.pages && (
              <div className="text-center py-3">
                <button
                  onClick={loadMore}
                  className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Load more notifications...
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationPanel;
