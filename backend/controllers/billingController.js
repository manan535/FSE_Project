import Workspace from '../models/Workspace.js';
import Membership from '../models/Membership.js';
import Invoice from '../models/Invoice.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { PLAN_CONFIG } from '../middlewares/planGate.js';


const PLAN_TIER_ORDER = ['free', 'pro', 'pro_plus', 'super_pro_max'];


export const getBillingInfo = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) return res.status(400).json({ message: 'Workspace ID required' });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

  
    const membership = await Membership.findOne({ user: req.user._id, workspace: workspaceId });
    if (!membership) return res.status(403).json({ message: 'Access denied' });

    const activeMembers = await Membership.countDocuments({ workspace: workspaceId, status: 'active' });
    const currentProjectCount = await Project.countDocuments({ workspace: workspaceId });

    const plan = workspace.plan || 'free';
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;

   
    let remainingDays = null;
    let totalDays = null;
    if (workspace.planEndDate) {
      const now = new Date();
      const end = new Date(workspace.planEndDate);
      const start = new Date(workspace.planStartDate || workspace.updatedAt);
      remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    }

 
    const projects = await Project.find({ workspace: workspaceId }).select('_id name').lean();
    const taskUsage = await Promise.all(
      projects.map(async (p) => {
        const count = await Task.countDocuments({ project: p._id });
        return { projectId: p._id, projectName: p.name, taskCount: count, maxTasks: config.maxTasksPerProject };
      })
    );

    res.json({
      currentPlan: plan,
      planLabel: config.label,
      maxMembers: config.maxMembers >= 999999 ? 'Unlimited' : config.maxMembers,
      maxMembersRaw: config.maxMembers,
      activeMembers,
      maxProjects: config.maxProjects,
      maxTasksPerProject: config.maxTasksPerProject,
      chatEnabled: config.chatEnabled,
      currentProjectCount,
      taskUsage,
      remainingDays,
      totalDays,
      planStartDate: workspace.planStartDate,
      planEndDate: workspace.planEndDate,
      planConfig: PLAN_CONFIG,
      isOwner: workspace.owner.toString() === req.user._id.toString(),
      isAdmin: membership.role === 'admin'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Upgrade plan (no downgrades allowed) ─────────────────────────────────────
export const upgradePlan = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { plan } = req.body;

    if (!workspaceId) return res.status(400).json({ message: 'Workspace ID required' });
    if (!plan || !PLAN_CONFIG[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Only owner or admin can upgrade
    const membership = await Membership.findOne({ user: req.user._id, workspace: workspaceId });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change the plan' });
    }

    const oldPlan = workspace.plan || 'free';
    const oldTier = PLAN_TIER_ORDER.indexOf(oldPlan);
    const newTier = PLAN_TIER_ORDER.indexOf(plan);

    // ─── No downgrade enforcement ────────────────────────────────────────────
    if (newTier <= oldTier) {
      return res.status(403).json({
        message: `Downgrading is not permitted. You are currently on the ${PLAN_CONFIG[oldPlan].label} plan. You can only upgrade to a higher tier.`,
        code: 'DOWNGRADE_NOT_ALLOWED',
        currentPlan: oldPlan,
        requestedPlan: plan
      });
    }

    const config = PLAN_CONFIG[plan];

    // Set plan dates
    const now = new Date();
    let periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // All paid plans are monthly billing

    workspace.plan = plan;
    workspace.planStartDate = now;
    workspace.planEndDate = periodEnd;
    workspace.settings.maxMembers = config.maxMembers;
    await workspace.save();

    // Generate invoice for paid plans
    let invoice = null;
    if (config.price > 0) {
      const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      invoice = await Invoice.create({
        workspace: workspaceId,
        invoiceId,
        plan,
        amount: config.price,
        currency: 'USD',
        status: 'paid',
        description: `${config.label} plan subscription`,
        period: { start: now, end: periodEnd }
      });
    }

    // Audit log
    createAuditLog({
      userId: req.user._id,
      tenantId: workspaceId,
      action: 'PLAN_UPGRADED',
      description: `Plan upgraded from "${PLAN_CONFIG[oldPlan].label}" to "${config.label}"`,
      req,
      metadata: { oldPlan, newPlan: plan, price: config.price }
    });

    res.json({
      message: `Successfully upgraded to ${config.label} plan`,
      workspace: {
        _id: workspace._id,
        plan: workspace.plan,
        planStartDate: workspace.planStartDate,
        planEndDate: workspace.planEndDate,
        settings: workspace.settings
      },
      invoice
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get usage stats ──────────────────────────────────────────────────────────
export const getUsageStats = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) return res.status(400).json({ message: 'Workspace ID required' });

    const membership = await Membership.findOne({ user: req.user._id, workspace: workspaceId });
    if (!membership) return res.status(403).json({ message: 'Access denied' });

    const workspace = await Workspace.findById(workspaceId).lean();
    const plan = workspace?.plan || 'free';
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;

    const projectCount = await Project.countDocuments({ workspace: workspaceId });
    const memberCount = await Membership.countDocuments({ workspace: workspaceId, status: 'active' });

    // Per-project task counts
    const projects = await Project.find({ workspace: workspaceId }).select('_id name').lean();
    const taskUsage = await Promise.all(
      projects.map(async (p) => {
        const count = await Task.countDocuments({ project: p._id });
        return { projectId: p._id, projectName: p.name, taskCount: count };
      })
    );

    res.json({
      plan,
      planLabel: config.label,
      projects: { current: projectCount, max: config.maxProjects },
      tasksPerProject: { max: config.maxTasksPerProject, usage: taskUsage },
      members: { current: memberCount, max: config.maxMembers >= 999999 ? 'Unlimited' : config.maxMembers },
      chatEnabled: config.chatEnabled
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get invoices / billing history ──────────────────────────────────────────
export const getInvoices = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) return res.status(400).json({ message: 'Workspace ID required' });

    const membership = await Membership.findOne({ user: req.user._id, workspace: workspaceId });
    if (!membership) return res.status(403).json({ message: 'Access denied' });

    const invoices = await Invoice.find({ workspace: workspaceId }).sort('-createdAt');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Download invoice as CSV ──────────────────────────────────────────────────
export const downloadInvoice = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { invoiceId } = req.params;

    if (!workspaceId) return res.status(400).json({ message: 'Workspace ID required' });

    const membership = await Membership.findOne({ user: req.user._id, workspace: workspaceId });
    if (!membership) return res.status(403).json({ message: 'Access denied' });

    const invoice = await Invoice.findOne({ _id: invoiceId, workspace: workspaceId })
      .populate('workspace', 'name');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const workspace = await Workspace.findById(workspaceId);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

    const planLabel = PLAN_CONFIG[invoice.plan]?.label || invoice.plan;

    const csvContent = [
      'ScaleNest Invoice',
      '',
      `Invoice ID,${invoice.invoiceId}`,
      `Date,${formatDate(invoice.createdAt)}`,
      `Workspace,${workspace?.name || 'N/A'}`,
      `Status,${invoice.status.toUpperCase()}`,
      '',
      'Description,Plan,Period Start,Period End,Amount',
      `${invoice.description},${planLabel},${formatDate(invoice.period?.start)},${formatDate(invoice.period?.end)},$${invoice.amount.toFixed(2)} ${invoice.currency}`,
      '',
      `Total Amount,$${invoice.amount.toFixed(2)} ${invoice.currency}`
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceId}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
