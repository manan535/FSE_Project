import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Membership from '../models/Membership.js';

// ─── Plan limits configuration (single source of truth) ─────────────────────
export const PLAN_CONFIG = {
  free:          { tier: 0, maxProjects: 1,  maxTasksPerProject: 2,  maxMembers: 5,      chatEnabled: false, price: 0,   label: 'Free',           period: 'forever'   },
  pro:           { tier: 1, maxProjects: 5,  maxTasksPerProject: 5,  maxMembers: 50,     chatEnabled: true,  price: 29,  label: 'Pro',            period: 'per month' },
  pro_plus:      { tier: 2, maxProjects: 7,  maxTasksPerProject: 7,  maxMembers: 100,    chatEnabled: true,  price: 79,  label: 'Pro Plus',       period: 'per month' },
  super_pro_max: { tier: 3, maxProjects: 10, maxTasksPerProject: 15, maxMembers: 999999, chatEnabled: true,  price: 299, label: 'Super Pro Max',  period: 'per month' },
};

// ─── Helper: Get workspace with plan ─────────────────────────────────────────
const getWorkspacePlan = async (req) => {
  const workspaceId = req.headers['x-workspace-id'] || req.workspace;
  if (!workspaceId) return null;
  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) return null;
  const plan = workspace.plan || 'free';
  return { workspace, plan, config: PLAN_CONFIG[plan] || PLAN_CONFIG.free };
};

// ─── Middleware: Check project creation limit ────────────────────────────────
export const checkProjectLimit = async (req, res, next) => {
  try {
    const result = await getWorkspacePlan(req);
    if (!result) return res.status(400).json({ message: 'Workspace not found' });

    const { workspace, plan, config } = result;
    const currentCount = await Project.countDocuments({ workspace: workspace._id });

    if (currentCount >= config.maxProjects) {
      return res.status(403).json({
        message: `Project limit reached. Your ${config.label} plan allows up to ${config.maxProjects} project${config.maxProjects > 1 ? 's' : ''}. Please upgrade to create more projects.`,
        code: 'PROJECT_LIMIT_REACHED',
        currentCount,
        maxAllowed: config.maxProjects,
        currentPlan: plan
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking project limits', error: error.message });
  }
};

// ─── Middleware: Check task creation limit per project ────────────────────────
export const checkTaskLimit = async (req, res, next) => {
  try {
    const result = await getWorkspacePlan(req);
    if (!result) return res.status(400).json({ message: 'Workspace not found' });

    const { plan, config } = result;
    const projectId = req.body.project;

    if (!projectId) {
      return next(); // Let the controller handle missing project ID
    }

    const currentCount = await Task.countDocuments({ project: projectId });

    if (currentCount >= config.maxTasksPerProject) {
      return res.status(403).json({
        message: `Task limit reached. Your ${config.label} plan allows up to ${config.maxTasksPerProject} task${config.maxTasksPerProject > 1 ? 's' : ''} per project. Please upgrade to add more tasks.`,
        code: 'TASK_LIMIT_REACHED',
        currentCount,
        maxAllowed: config.maxTasksPerProject,
        currentPlan: plan
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking task limits', error: error.message });
  }
};

// ─── Middleware: Block chat access for free plan ─────────────────────────────
export const checkChatAccess = async (req, res, next) => {
  try {
    const result = await getWorkspacePlan(req);
    if (!result) return res.status(400).json({ message: 'Workspace not found' });

    const { plan, config } = result;

    if (!config.chatEnabled) {
      return res.status(403).json({
        message: 'Chat is not available on the Free plan. Upgrade to Pro or above to unlock workspace messaging.',
        code: 'CHAT_ACCESS_DENIED',
        currentPlan: plan
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking chat access', error: error.message });
  }
};

// ─── Middleware: Check member limit before joining ───────────────────────────
export const checkMemberLimit = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return next();

    const workspace = await Workspace.findOne({ inviteCode }).lean();
    if (!workspace) return next(); // Let controller handle "not found"

    const plan = workspace.plan || 'free';
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
    const currentCount = await Membership.countDocuments({ workspace: workspace._id, status: 'active' });

    if (currentCount >= config.maxMembers) {
      return res.status(403).json({
        message: `Member limit reached. The ${config.label} plan allows up to ${config.maxMembers >= 999999 ? 'unlimited' : config.maxMembers} members. The workspace admin must upgrade to add more members.`,
        code: 'MEMBER_LIMIT_REACHED',
        currentCount,
        maxAllowed: config.maxMembers,
        currentPlan: plan
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking member limits', error: error.message });
  }
};
