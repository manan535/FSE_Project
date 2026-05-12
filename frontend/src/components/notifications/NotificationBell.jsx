/**
 * Notification Bell — Navbar icon with animated unread badge
 *
 * Toggles the NotificationPanel dropdown on click.
 * Shows a pulsing red badge when there are unread notifications.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell } from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from './NotificationPanel';

const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-gray-800/50 transition-colors duration-200"
        id="notification-bell-btn"
      >
        <FaBell className="text-gray-400 text-xl" />

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-lg notification-badge-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <NotificationPanel onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
