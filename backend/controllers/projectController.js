import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { createAuditLog } from '../utils/auditLogger.js';

export const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, color, dueDate } = req.body;

    const project = await Project.create({
      name,
      description,
      workspace: req.workspace,
      owner: req.user._id,
      members: [req.user._id], // Auto-add owner as first member
      status,
      priority,
      color,
      dueDate
    });

    // Audit log: project created (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: req.workspace,
      action: 'PROJECT_CREATED',
      description: `Project "${project.name}" created`,
      req,
      metadata: { projectId: project._id }
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const filter = { workspace: req.workspace };

    // Non-admin users only see projects they are a member of
    if (req.userRole && req.userRole !== 'admin') {
      filter.members = req.user._id;
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('members', 'name email avatar')
      .sort('-createdAt');

    // Attach task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const counts = { todo: 0, in_progress: 0, done: 0, total: 0 };
        taskCounts.forEach(({ _id, count }) => {
          counts[_id] = count;
          counts.total += count;
        });

        return {
          ...project.toObject(),
          taskCounts: counts
        };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      workspace: req.workspace,
      members: req.user._id
    })
      .populate('owner', 'name email')
      .populate('members', 'name email avatar')
      .sort('-createdAt');

    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const counts = { todo: 0, in_progress: 0, done: 0, total: 0 };
        taskCounts.forEach(({ _id, count }) => {
          counts[_id] = count;
          counts.total += count;
        });

        return {
          ...project.toObject(),
          taskCounts: counts
        };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspace
    })
      .populate('owner', 'name email')
      .populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspace
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description !== undefined ? req.body.description : project.description;
    project.status = req.body.status || project.status;
    project.priority = req.body.priority || project.priority;
    project.color = req.body.color || project.color;
    project.dueDate = req.body.dueDate || project.dueDate;

    if (req.body.members) {
      project.members = req.body.members;
    }

    const updatedProject = await project.save();

    // Audit log: project updated (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: req.workspace,
      action: 'PROJECT_UPDATED',
      description: `Project "${project.name}" updated`,
      req,
      metadata: { projectId: project._id, changes: req.body }
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspace
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Cascade delete all tasks belonging to this project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    // Audit log: project deleted (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: req.workspace,
      action: 'PROJECT_DELETED',
      description: `Project "${project.name}" and its tasks deleted`,
      req,
      metadata: { projectId: project._id, projectName: project.name }
    });

    res.json({ message: 'Project and all its tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};