/**
 * Notification Model
 *
 * Stores in-app notifications for users within a workspace.
 * Supports types: info, warning, danger, success
 * Supports priorities: low, medium, high
 * Includes TTL index to auto-clean old notifications after 90 days.
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'danger', 'success'],
    default: 'info',
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  category: {
    type: String,
    enum: ['general', 'invitation'],
    default: 'general',
  },
  relatedInvitation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectInvitation',
    default: null,
  },
  actionStatus: {
    type: String,
    enum: ['none', 'pending', 'accepted', 'rejected'],
    default: 'none',
  },
}, {
  timestamps: true,
});

// ─── Indexes ────────────────────────────────────────────────────────────────────

// Fast lookup for user's notifications in a workspace
notificationSchema.index({ workspace: 1, user: 1, isRead: 1 });

// Sort by newest first
notificationSchema.index({ createdAt: -1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Prevent duplicate alerts for the same task (used by deadline checker)
notificationSchema.index({ relatedTask: 1, type: 1, user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
