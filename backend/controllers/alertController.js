/**
 * Alert Controller
 *
 * Provides endpoints for task deadline alerts:
 * - Fetch overdue and upcoming-deadline tasks for dashboard banners
 * - Manually trigger the deadline checker
 */

import Task from '../models/Task.js';
import { checkDeadlines } from '../cron/taskDeadlineChecker.js';

/**
 * GET /api/alerts/tasks
 * Returns structured alert data for the current user's workspace:
 * { overdue: [...], dueSoon: [...] }
 */
export const getTaskAlerts = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(now.getHours() + 24);

    // Base filter: workspace tasks not done, with a dueDate
    const baseFilter = {
      workspace: workspaceId,
      status: { $ne: 'done' },
      dueDate: { $ne: null },
    };

    // Non-admin users only see their assigned tasks
    if (req.userRole && req.userRole !== 'admin') {
      baseFilter.assignees = req.user._id;
    }

    // Overdue tasks: dueDate < now
    const overdueTasks = await Task.find({
      ...baseFilter,
      dueDate: { $lt: now },
    })
      .populate('assignees', 'name email avatar')
      .populate('project', 'name color')
      .sort({ dueDate: 1 })
      .lean();

    // Due soon tasks: dueDate between now and now + 24h
    const dueSoonTasks = await Task.find({
      ...baseFilter,
      dueDate: { $gte: now, $lte: tomorrow },
    })
      .populate('assignees', 'name email avatar')
      .populate('project', 'name color')
      .sort({ dueDate: 1 })
      .lean();

    res.json({
      overdue: overdueTasks,
      dueSoon: dueSoonTasks,
      summary: {
        overdueCount: overdueTasks.length,
        dueSoonCount: dueSoonTasks.length,
        totalAlerts: overdueTasks.length + dueSoonTasks.length,
      },
    });
  } catch (error) {
    console.error('getTaskAlerts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/alerts/check-deadlines
 * Manually trigger the deadline checker.
 * Useful for testing or on-demand checking.
 */
export const triggerDeadlineCheck = async (req, res) => {
  try {
    const result = await checkDeadlines();
    res.json({
      message: 'Deadline check completed',
      ...result,
    });
  } catch (error) {
    console.error('triggerDeadlineCheck error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
