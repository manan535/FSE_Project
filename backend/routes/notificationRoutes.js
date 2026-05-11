/**
 * Notification Routes
 *
 * All routes are protected with JWT auth + workspace access check.
 * Users can only access their own notifications within their workspace.
 */

import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  exportNotifications,
  acceptInviteNotification,
  rejectInviteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(checkWorkspaceAccess);

// GET    /api/notifications              — Fetch paginated notifications
router.get('/', getNotifications);

// GET    /api/notifications/export       — Export notifications as JSON
router.get('/export', exportNotifications);

// PATCH  /api/notifications/read-all     — Mark all as read (must be before :id routes)
router.patch('/read-all', markAllAsRead);

// POST   /api/notifications/:id/accept-invite — Accept invitation from notification
router.post('/:id/accept-invite', acceptInviteNotification);

// POST   /api/notifications/:id/reject-invite — Reject invitation from notification
router.post('/:id/reject-invite', rejectInviteNotification);

// PATCH  /api/notifications/:id/read     — Mark single notification as read
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id          — Delete a notification
router.delete('/:id', deleteNotification);

export default router;
