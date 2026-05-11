import Workspace from '../models/Workspace.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';
import { workspaceCreatedEmail, invitationEmail } from '../templates/emailTemplates.js';
import { createAuditLog } from '../utils/auditLogger.js';

export const createWorkspace = async (req, res) => {
  try {
    if (!req.user) {
  return res.status(401).json({ message: "User not authenticated" });
}
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a workspace name' });
    }

    const workspace = await Workspace.create({
      name,
      owner: req.user._id
    });

    await Membership.create({
      user: req.user._id,
      workspace: workspace._id,
      role: 'admin'
    });

    await User.findByIdAndUpdate(req.user._id, {
      currentWorkspace: workspace._id
    });

    // Send workspace created email (fire-and-forget)
    sendEmail(
      req.user.email,
      '🏢 Workspace Created: ' + name,
      workspaceCreatedEmail(req.user.name, name)
    ).catch((err) => console.error('Workspace created email failed:', err.message));

    res.status(201).json(workspace);
  } catch (error) {
  console.error("🔥 ERROR:", error);   // ADD THIS
  res.status(500).json({ message: 'Server error', error: error.message });
}
};

export const getMyWorkspaces = async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id,
      status: 'active'
    }).populate('workspace');

    const workspaces = memberships.map(m => ({
      ...m.workspace.toObject(),
      role: m.role
    }));

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('owner', 'name email');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const membership = await Membership.findOne({
      user: req.user._id,
      workspace: workspace._id
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      ...workspace.toObject(),
      role: membership.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const switchWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.body;

    const membership = await Membership.findOne({
      user: req.user._id,
      workspace: workspaceId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied to this workspace' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      currentWorkspace: workspaceId
    });

    const workspace = await Workspace.findById(workspaceId);
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const joinWorkspace = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const workspace = await Workspace.findOne({ inviteCode });

    if (!workspace) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    const existingMembership = await Membership.findOne({
      user: req.user._id,
      workspace: workspace._id
    });

    if (existingMembership) {
      return res.status(400).json({ message: 'You are already a member of this workspace' });
    }

    const memberCount = await Membership.countDocuments({
      workspace: workspace._id,
      status: 'active'
    });

    if (memberCount >= workspace.settings.maxMembers) {
      return res.status(400).json({ message: 'Workspace has reached maximum member limit' });
    }

    await Membership.create({
      user: req.user._id,
      workspace: workspace._id,
      role: 'member'
    });

    // Send invitation/join notification email to workspace owner (fire-and-forget)
    const owner = await User.findById(workspace.owner);
    if (owner) {
      sendEmail(
        owner.email,
        '🤝 New member joined: ' + workspace.name,
        invitationEmail(req.user.name, workspace.name, workspace.inviteCode)
      ).catch((err) => console.error('Join notification email failed:', err.message));
    }

    // Audit log: member added (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: workspace._id,
      action: 'MEMBER_ADDED',
      description: `User "${req.user.name}" joined workspace "${workspace.name}"`,
      req,
      metadata: { workspaceName: workspace.name }
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const membership = await Membership.findOne({
      user: req.user._id,
      workspace: workspace._id
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update workspace' });
    }

    workspace.name = req.body.name || workspace.name;
    workspace.plan = req.body.plan || workspace.plan;
    
    if (req.body.settings) {
      workspace.settings = { ...workspace.settings, ...req.body.settings };
    }

    const updatedWorkspace = await workspace.save();

    // Audit log: settings update (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: workspace._id,
      action: 'SETTINGS_UPDATE',
      description: `Workspace "${workspace.name}" settings updated`,
      req,
      metadata: { changes: req.body }
    });

    res.json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getWorkspaceMembers = async (req, res) => {
  try {
    const members = await Membership.find({
      workspace: req.params.id,
      status: 'active'
    }).populate('user', 'name email avatar');

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const membership = await Membership.findById(memberId);

    if (!membership) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const requesterMembership = await Membership.findOne({
      user: req.user._id,
      workspace: membership.workspace
    });

    if (!requesterMembership || requesterMembership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    await Membership.findByIdAndDelete(memberId);

    // Audit log: member removed (fire-and-forget)
    createAuditLog({
      userId: req.user._id,
      tenantId: membership.workspace,
      action: 'MEMBER_REMOVED',
      description: `Member removed from workspace`,
      req,
      metadata: { removedMembershipId: memberId }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};