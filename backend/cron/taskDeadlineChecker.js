/**
 * Task Deadline Checker — Cron Job
 *
 * Runs daily at 8:00 AM to scan all tasks and:
 * 1. Detect tasks due within the next 24 hours → send reminder
 * 2. Detect overdue tasks (past due date) → send overdue warning
 *
 * For each detected task:
 * - Checks for duplicate notifications (within last 24h)
 * - Creates in-app Notification
 * - Sends email to each assignee
 */

import cron from 'node-cron';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';
import { taskDeadlineEmail, taskOverdueEmail } from '../templates/emailTemplates.js';

/**
 * Check all task deadlines and create notifications + send emails.
 * Exported so it can be triggered manually via API.
 */
export const checkDeadlines = async () => {
  console.log('🔍 Running task deadline checker...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(now.getHours() + 24);
  const yesterday = new Date(now);
  yesterday.setHours(now.getHours() - 24);

  let dueSoonCount = 0;
  let overdueCount = 0;
  let emailsSent = 0;

  try {
    // ───────────────────────────────────────────────────────────────────────────
    // 1. Tasks due within the next 24 hours (due soon)
    // ───────────────────────────────────────────────────────────────────────────
    const dueSoonTasks = await Task.find({
      status: { $ne: 'done' },
      dueDate: { $gte: now, $lte: tomorrow },
    })
      .populate('assignees', 'name email')
      .populate('project', 'name')
      .lean();

    for (const task of dueSoonTasks) {
      for (const assignee of (task.assignees || [])) {
        // Check for duplicate notification in the last 24 hours
        const existingNotif = await Notification.findOne({
          relatedTask: task._id,
          user: assignee._id,
          type: 'warning',
          createdAt: { $gte: yesterday },
        });

        if (existingNotif) continue; // Skip duplicate

        // Create in-app notification
        await Notification.create({
          workspace: task.workspace,
          user: assignee._id,
          type: 'warning',
          title: 'Task Due Tomorrow',
          message: `Task "${task.title}" is due tomorrow. Make sure to complete it on time!`,
          priority: 'medium',
          relatedTask: task._id,
        });
        dueSoonCount++;

        // Send email (fire-and-forget, don't block the loop)
        sendEmail(
          assignee.email,
          `⚡ Task Due Tomorrow: "${task.title}"`,
          taskDeadlineEmail(assignee.name, task.title, task.dueDate, task.project?.name)
        )
          .then(() => { emailsSent++; })
          .catch((err) => console.error(`Failed to send deadline email to ${assignee.email}:`, err.message));
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // 2. Overdue tasks (dueDate has passed)
    // ───────────────────────────────────────────────────────────────────────────
    const overdueTasks = await Task.find({
      status: { $ne: 'done' },
      dueDate: { $lt: now },
    })
      .populate('assignees', 'name email')
      .populate('project', 'name')
      .lean();

    for (const task of overdueTasks) {
      for (const assignee of (task.assignees || [])) {
        // Check for duplicate notification in the last 24 hours
        const existingNotif = await Notification.findOne({
          relatedTask: task._id,
          user: assignee._id,
          type: 'danger',
          createdAt: { $gte: yesterday },
        });

        if (existingNotif) continue; // Skip duplicate

        // Create in-app notification
        await Notification.create({
          workspace: task.workspace,
          user: assignee._id,
          type: 'danger',
          title: 'Task Overdue!',
          message: `Task "${task.title}" is overdue! It was due on ${new Date(task.dueDate).toLocaleDateString()}. Please complete it immediately.`,
          priority: 'high',
          relatedTask: task._id,
        });
        overdueCount++;

        // Send email (fire-and-forget)
        sendEmail(
          assignee.email,
          `🚨 OVERDUE: "${task.title}" has passed its deadline`,
          taskOverdueEmail(assignee.name, task.title, task.dueDate, task.project?.name)
        )
          .then(() => { emailsSent++; })
          .catch((err) => console.error(`Failed to send overdue email to ${assignee.email}:`, err.message));
      }
    }

    const summary = {
      dueSoonAlerts: dueSoonCount,
      overdueAlerts: overdueCount,
      totalAlerts: dueSoonCount + overdueCount,
      checkedAt: now.toISOString(),
    };

    console.log(`✅ Deadline check complete:`, summary);
    return summary;
  } catch (error) {
    console.error('❌ Deadline checker error:', error);
    throw error;
  }
};

/**
 * Start the cron job. Call this once from server.js.
 * Schedule: Every day at 8:00 AM server time.
 */
export const startDeadlineChecker = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      await checkDeadlines();
    } catch (error) {
      console.error('Cron deadline checker failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Adjust to your timezone
  });

  console.log('⏰ Task deadline checker cron job scheduled (daily at 8:00 AM)');
};
