/**
 * Notification Controller
 *
 * Handles CRUD operations for in-app notifications.
 * All operations are scoped to the authenticated user's workspace.
 */

import Notification from '../models/Notification.js';
import ProjectInvitation from '../models/ProjectInvitation.js';
import Project from '../models/Project.js';
import { createAuditLog } from '../utils/auditLogger.js';

/**
 * GET /api/notifications
 * Fetch paginated notifications for the logged-in user.
 * Query params: page, limit, type, priority, search
 */
export const getNotifications = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const {
      page = 1,
      limit = 20,
      type,
      priority,
      search,
    } = req.query;

    const filter = {
      workspace: workspaceId,
      user: req.user._id,
    };

    // Optional filters
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('relatedTask', 'title status priority dueDate')
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        workspace: workspaceId,
        user: req.user._id,
        isRead: false,
      }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
export const markAsRead = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: workspaceId,
        user: req.user._id, // Ownership validation
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all unread notifications as read for the current user.
 */
export const markAllAsRead = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const result = await Notification.updateMany(
      {
        workspace: workspaceId,
        user: req.user._id,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification (ownership validated).
 */
export const deleteNotification = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      workspace: workspaceId,
      user: req.user._id, // Ownership validation
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/notifications/export
 * Export user's notifications as JSON.
 */
export const exportNotifications = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const notifications = await Notification.find({
      workspace: workspaceId,
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate('relatedTask', 'title status priority dueDate')
      .lean();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=notifications.json');
    res.json(notifications);
  } catch (error) {
    console.error('exportNotifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/notifications/:id/accept-invite
 * Accept a project invitation directly from the notification panel.
 */
export const acceptInviteNotification = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    // Find the notification and verify ownership
    const notification = await Notification.findOne({
      _id: req.params.id,
      workspace: workspaceId,
      user: req.user._id,
      category: 'invitation',
      actionStatus: 'pending',
    });

    if (!notification) {
      return res.status(404).json({ message: 'Invitation notification not found or already processed' });
    }

    // Find the linked invitation
    const invitation = await ProjectInvitation.findOne({
      _id: notification.relatedInvitation,
      status: 'pending',
    });

    if (!invitation) {
      notification.actionStatus = 'rejected';
      notification.isRead = true;
      await notification.save();
      return res.status(404).json({ message: 'Invitation no longer exists or was already processed' });
    }

    // Check expiry
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      notification.actionStatus = 'rejected';
      notification.isRead = true;
      await notification.save();
      return res.status(400).json({ message: 'This invitation has expired' });
    }

    // Verify email match
    if (req.user.email.toLowerCase() !== invitation.invitedEmail) {
      return res.status(403).json({ message: 'This invitation was sent to a different email address' });
    }

    // Add user to project
    const project = await Project.findById(invitation.project);
    if (!project) {
      return res.status(404).json({ message: 'Project no longer exists' });
    }

    if (!project.members.some((m) => m.toString() === req.user._id.toString())) {
      project.members.push(req.user._id);
    }
    project.pendingInvites = project.pendingInvites.filter(
      (id) => id.toString() !== invitation._id.toString()
    );
    await project.save();

    // Update invitation & notification
    invitation.status = 'accepted';
    await invitation.save();

    notification.actionStatus = 'accepted';
    notification.isRead = true;
    await notification.save();

    // Audit log
    createAuditLog({
      userId: req.user._id,
      tenantId: workspaceId,
      action: 'PROJECT_INVITE_ACCEPTED',
      description: `${req.user.name} accepted invitation to project "${project.name}"`,
      req,
      metadata: { projectId: project._id, invitationId: invitation._id }
    });

    res.json({
      message: 'Invitation accepted! You are now a project member.',
      projectId: project._id,
      notification: { ...notification.toObject(), actionStatus: 'accepted' },
    });
  } catch (error) {
    console.error('acceptInviteNotification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/notifications/:id/reject-invite
 * Reject a project invitation directly from the notification panel.
 */
export const rejectInviteNotification = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    // Find the notification and verify ownership
    const notification = await Notification.findOne({
      _id: req.params.id,
      workspace: workspaceId,
      user: req.user._id,
      category: 'invitation',
      actionStatus: 'pending',
    });

    if (!notification) {
      return res.status(404).json({ message: 'Invitation notification not found or already processed' });
    }

    // Find the linked invitation
    const invitation = await ProjectInvitation.findOne({
      _id: notification.relatedInvitation,
      status: 'pending',
    });

    if (invitation) {
      // Verify email match
      if (req.user.email.toLowerCase() !== invitation.invitedEmail) {
        return res.status(403).json({ message: 'This invitation was sent to a different email address' });
      }

      // Remove from project's pendingInvites
      const project = await Project.findById(invitation.project);
      if (project) {
        project.pendingInvites = project.pendingInvites.filter(
          (id) => id.toString() !== invitation._id.toString()
        );
        await project.save();
      }

      invitation.status = 'rejected';
      await invitation.save();
    }

    // Update notification
    notification.actionStatus = 'rejected';
    notification.isRead = true;
    await notification.save();

    res.json({
      message: 'Invitation rejected',
      notification: { ...notification.toObject(), actionStatus: 'rejected' },
    });
  } catch (error) {
    console.error('rejectInviteNotification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
