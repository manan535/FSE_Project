/**
 * Notification Context
 *
 * Global state management for notifications and task alerts.
 * Provides: notifications list, unread count, task alerts,
 * auto-fetch on login, polling every 60s, and optimistic UI updates.
 */

import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { useLocation } from 'react-router-dom';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const location = useLocation();
  const isOnSetupPage = location.pathname === '/workspace-setup';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [taskAlerts, setTaskAlerts] = useState({ overdue: [], dueSoon: [] });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const pollingRef = useRef(null);
  const hasShownLoginAlerts = useRef(false);

  // ─── Fetch notifications (paginated) ────────────────────────────────────────
  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      const { data } = await axios.get('/api/notifications', {
        params: { page, limit: 20 },
      });

      if (append) {
        setNotifications((prev) => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }

      setUnreadCount(data.unreadCount);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  // ─── Fetch task alerts ──────────────────────────────────────────────────────
  const fetchTaskAlerts = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      const { data } = await axios.get('/api/alerts/tasks');
      setTaskAlerts({
        overdue: data.overdue || [],
        dueSoon: data.dueSoon || [],
      });
    } catch (error) {
      console.error('Failed to fetch task alerts:', error);
    }
  }, [currentWorkspace]);

  // ─── Mark single notification as read (optimistic) ──────────────────────────
  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await axios.patch(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ─── Mark all as read (optimistic) ──────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await axios.patch('/api/notifications/read-all');
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ─── Delete notification (optimistic) ───────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    const notification = notifications.find((n) => n._id === id);

    // Optimistic removal
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await axios.delete(`/api/notifications/${id}`);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // ─── Load more (infinite scroll) ───────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !loading) {
      fetchNotifications(pagination.page + 1, true);
    }
  }, [pagination, loading, fetchNotifications]);

  // ─── Accept invitation from notification ────────────────────────────────────
  const acceptInviteFromNotification = useCallback(async (notificationId) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notificationId ? { ...n, actionStatus: 'accepted', isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const { data } = await axios.post(`/api/notifications/${notificationId}/accept-invite`);
      toast.success(data.message || 'Invitation accepted!');
      return data;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
      fetchNotifications(); // Revert
      throw error;
    }
  }, [fetchNotifications]);

  // ─── Reject invitation from notification ────────────────────────────────────
  const rejectInviteFromNotification = useCallback(async (notificationId) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notificationId ? { ...n, actionStatus: 'rejected', isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const { data } = await axios.post(`/api/notifications/${notificationId}/reject-invite`);
      toast.success(data.message || 'Invitation rejected');
      return data;
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to reject invitation');
      fetchNotifications(); // Revert
      throw error;
    }
  }, [fetchNotifications]);

  // ─── Auto-fetch on workspace change ─────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && currentWorkspace && !isOnSetupPage) {
      fetchNotifications();
      fetchTaskAlerts();
      hasShownLoginAlerts.current = false;
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setTaskAlerts({ overdue: [], dueSoon: [] });
    }
  }, [isAuthenticated, currentWorkspace, isOnSetupPage, fetchNotifications, fetchTaskAlerts]);

  // ─── Polling every 60 seconds ───────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && currentWorkspace && !isOnSetupPage) {
      pollingRef.current = setInterval(() => {
        fetchNotifications();
        fetchTaskAlerts();
      }, 60000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isAuthenticated, currentWorkspace, isOnSetupPage, fetchNotifications, fetchTaskAlerts]);

  const value = {
    notifications,
    unreadCount,
    taskAlerts,
    loading,
    pagination,
    fetchNotifications,
    fetchTaskAlerts,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    acceptInviteFromNotification,
    rejectInviteFromNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
