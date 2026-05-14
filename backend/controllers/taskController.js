import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import Membership from '../models/Membership.js';
import { sendEmail } from '../services/emailService.js';
import { taskDeadlineEmail } from '../templates/emailTemplates.js';
import { createAuditLog } from '../utils/auditLogger.js';

const populateTask = (query) => {
  return query
    .populate('assignees', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('project', 'name color');
};

// ─── Helper: Notify assignees when they are assigned to a task ──────────────────
const notifyAssignedUsers = async (task, assigneeIds, assignerName, workspaceId) => {
  try {
    for (const userId of assigneeIds) {
      // Don't notify the person who assigned themselves
      if (userId.toString() === task.createdBy?.toString()) continue;

      await Notification.create({
        workspace: workspaceId,
        user: userId,
        type: 'info',
        title: 'New Task Assigned',
        message: `${assignerName} assigned you to "${task.title}".`,
        priority: task.priority === 'high' ? 'high' : 'medium',
        relatedTask: task._id,
      });
    }
  } catch (error) {
    console.error('Failed to notify assigned users:', error.message);
  }
};

// ─── Helper: Notify admins when a task is completed ─────────────────────────────
const notifyAdminsOnCompletion = async (task, completedByName, workspaceId) => {
  try {
    // Find all admin memberships for this workspace
    const adminMemberships = await Membership.find({
      workspace: workspaceId,
      role: 'admin',
      status: 'active',
    }).select('user');

    for (const membership of adminMemberships) {
      // Don't notify the admin if they completed it themselves
      if (membership.user.toString() === task.createdBy?.toString()) continue;

      await Notification.create({
        workspace: workspaceId,
        user: membership.user,
        type: 'success',
        title: 'Task Completed',
        message: `${completedByName} completed the task "${task.title}". 🎉`,
        priority: 'low',
        relatedTask: task._id,
      });
    }
  } catch (error) {
    console.error('Failed to notify admins on task completion:', error.message);
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignees, status, priority, dueDate } = req.body;
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID missing' });
    }

    if (!project) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Validate assignees are project members
    if (assignees && assignees.length > 0) {
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({ message: 'Project not found' });
      }
      const memberIds = projectDoc.members.map((m) => m.toString());
      const invalidAssignees = assignees.filter((a) => !memberIds.includes(a.toString()));
      if (invalidAssignees.length > 0) {
        return res.status(400).json({
          message: 'One or more assignees are not members of this project'
        });
      }
    }

    // Calculate position: place at end of the target column
    const lastTask = await Task.findOne({ project, status: status || 'todo' })
      .sort('-position')
      .select('position');
    const position = lastTask ? lastTask.position + 1000 : 1000;

    const task = await Task.create({
      title,
      description,
      workspace: workspaceId,
      project,
      assignees: assignees || [],
      createdBy: req.user._id,
      assignedBy: assignees && assignees.length > 0 ? req.user._id : undefined,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      position
    });

    // Notify assigned members (fire-and-forget)
    if (assignees && assignees.length > 0) {
      notifyAssignedUsers(task, assignees, req.user.name, workspaceId);
    }

    const populatedTask = await populateTask(Task.findById(task._id));

    // Audit log: task created (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: workspaceId,
      action: 'TASK_CREATED',
      description: `Task "${task.title}" created`,
      req,
      metadata: { taskId: task._id, projectId: task.project }
    });

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID missing' });
    }
    const filter = { workspace: workspaceId };

    // Members/viewers only see tasks assigned to them
    if (req.userRole && req.userRole !== 'admin') {
      filter.assignees = req.user._id;
    }

    if (req.query.project) {
      filter.project = req.query.project;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.assignee) {
      filter.assignees = req.query.assignee;
    }

    const tasks = await populateTask(
      Task.find(filter).sort('position createdAt')
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID missing' });
    }

    const filter = {
      workspace: workspaceId,
      project: req.params.projectId
    };

    // Members/viewers only see tasks assigned to them
    if (req.userRole && req.userRole !== 'admin') {
      filter.assignees = req.user._id;
    }

    const tasks = await populateTask(
      Task.find(filter).sort('position createdAt')
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID missing' });
    }

    const task = await populateTask(
      Task.findOne({
        _id: req.params.id,
        workspace: workspaceId
      })
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID missing' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: workspaceId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Track old assignees to detect newly added ones
    const oldAssigneeIds = task.assignees.map((id) => id.toString());

    task.title = req.body.title || task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate !== undefined ? req.body.dueDate : task.dueDate;

    if (req.body.assignees !== undefined) {
      // Validate assignees are project members
      if (req.body.assignees.length > 0) {
        const projectDoc = await Project.findById(task.project);
        if (projectDoc) {
          const memberIds = projectDoc.members.map((m) => m.toString());
          const invalidAssignees = req.body.assignees.filter((a) => !memberIds.includes(a.toString()));
          if (invalidAssignees.length > 0) {
            return res.status(400).json({
              message: 'One or more assignees are not members of this project'
            });
          }
        }
      }

      task.assignees = req.body.assignees;

      // Find newly added assignees and notify them
      const newAssigneeIds = req.body.assignees
        .map((id) => id.toString())
        .filter((id) => !oldAssigneeIds.includes(id));

      if (newAssigneeIds.length > 0) {
        task.assignedBy = req.user._id;
        notifyAssignedUsers(task, newAssigneeIds, req.user.name, workspaceId);
      }
    }

    if (req.body.status && req.body.status !== task.status) {
      const oldStatus = task.status;
      task.status = req.body.status;

      if (req.body.status === 'done' && oldStatus !== 'done') {
        task.completedAt = new Date();
        // Notify admins that a task was completed (fire-and-forget)
        notifyAdminsOnCompletion(task, req.user.name, workspaceId);
      } else if (req.body.status !== 'done') {
        task.completedAt = null;
      }
    }

    if (req.body.position !== undefined) {
      task.position = req.body.position;
    }

    const updatedTask = await task.save();
    const populatedTask = await populateTask(Task.findById(updatedTask._id));

    // Audit log: task updated (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: workspaceId,
      action: 'TASK_UPDATED',
      description: `Task "${task.title}" updated`,
      req,
      metadata: { taskId: task._id, changes: req.body }
    });

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Optimized endpoint for drag-and-drop moves
export const moveTask = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID missing' });
    }

    const { status, position } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: workspaceId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldStatus = task.status;
    task.status = status;
    task.position = position;

    if (status === 'done' && oldStatus !== 'done') {
      task.completedAt = new Date();
      // Notify admins that a task was completed via drag-and-drop (fire-and-forget)
      notifyAdminsOnCompletion(task, req.user.name, workspaceId);
    } else if (status !== 'done') {
      task.completedAt = null;
    }

    await task.save();
    const populatedTask = await populateTask(Task.findById(task._id));

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID missing' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: workspaceId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Audit log: task deleted (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: workspaceId,
      action: 'TASK_DELETED',
      description: `Task "${task.title}" deleted`,
      req,
      metadata: { taskId: task._id, taskTitle: task.title }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};