import ProjectInvitation from '../models/ProjectInvitation.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../services/emailService.js';
import { projectInvitationEmail } from '../templates/emailTemplates.js';
import { createAuditLog } from '../utils/auditLogger.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Send project invitation ────────────────────────────────────────────────────
export const sendProjectInvite = async (req, res) => {
  try {
    const { email, role } = req.body;
    const projectId = req.params.id;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Fetch the project
    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspace
    }).populate('owner', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only project owner or admin can invite
    if (
      project.owner._id.toString() !== req.user._id.toString() &&
      req.userRole !== 'admin'
    ) {
      return res.status(403).json({ message: 'Only the project owner or admin can send invitations' });
    }

    // Check if the target user is a workspace member
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return res.status(400).json({
        message: 'This user does not have a ScaleNest account. They need to register first.'
      });
    }

    const workspaceMembership = await Membership.findOne({
      user: targetUser._id,
      workspace: req.workspace,
      status: 'active'
    });

    if (!workspaceMembership) {
      return res.status(400).json({
        message: 'This user is not a member of your workspace. Invite them to the workspace first.'
      });
    }

    // Check if already a project member
    if (project.members.some((m) => m.toString() === targetUser._id.toString())) {
      return res.status(400).json({ message: 'This user is already a member of this project' });
    }

    // Check for existing pending invitation
    const existingInvite = await ProjectInvitation.findOne({
      project: projectId,
      invitedEmail: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'An invitation is already pending for this email' });
    }

    // Create the invitation
    const invitation = await ProjectInvitation.create({
      project: projectId,
      workspace: req.workspace,
      invitedBy: req.user._id,
      invitedEmail: email.toLowerCase(),
      role: role || 'member'
    });

    // Add to project's pendingInvites
    project.pendingInvites.push(invitation._id);
    await project.save();

    // Get workspace name for the email
    const workspace = await Workspace.findById(req.workspace);

    // Send the email
    const inviteLink = `${FRONTEND_URL}/invite/${invitation.inviteToken}`;
    try {
      await sendEmail(
        email,
        `You're invited to join "${project.name}" on ScaleNest`,
        projectInvitationEmail(req.user.name, project.name, workspace?.name || 'Workspace', inviteLink)
      );
    } catch (emailError) {
      // Email failure is non-blocking
    }

    // Create in-app notification for the invited user
    try {
      await Notification.create({
        workspace: req.workspace,
        user: targetUser._id,
        type: 'info',
        title: 'Project Invitation',
        message: `${req.user.name} invited you to join "${project.name}" as ${invitation.role}`,
        priority: 'high',
        category: 'invitation',
        relatedInvitation: invitation._id,
        actionStatus: 'pending',
      });
    } catch (notifError) {
      console.error('Failed to create invitation notification:', notifError.message);
    }

    // Audit log
    createAuditLog({
      userId: req.user._id,
      tenantId: req.workspace,
      action: 'PROJECT_INVITE_SENT',
      description: `Invitation sent to ${email} for project "${project.name}"`,
      req,
      metadata: { projectId, email, invitationId: invitation._id }
    });

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        _id: invitation._id,
        invitedEmail: invitation.invitedEmail,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get invite info (public — for the accept page) ─────────────────────────────
export const getInviteInfo = async (req, res) => {
  try {
    const invitation = await ProjectInvitation.findOne({
      inviteToken: req.params.token
    })
      .populate('project', 'name description color')
      .populate('workspace', 'name')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        message: `This invitation has already been ${invitation.status}`,
        status: invitation.status
      });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'This invitation has expired', status: 'expired' });
    }

    res.json({
      project: invitation.project,
      workspace: invitation.workspace,
      invitedBy: invitation.invitedBy,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Accept invitation ──────────────────────────────────────────────────────────
export const acceptInvite = async (req, res) => {
  try {
    const invitation = await ProjectInvitation.findOne({
      inviteToken: req.params.token,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'This invitation has expired' });
    }

    // Verify the logged-in user's email matches the invitation
    if (req.user.email.toLowerCase() !== invitation.invitedEmail) {
      return res.status(403).json({
        message: 'This invitation was sent to a different email address'
      });
    }

    // Add user to project members
    const project = await Project.findById(invitation.project);
    if (!project) {
      return res.status(404).json({ message: 'Project no longer exists' });
    }

    if (!project.members.some((m) => m.toString() === req.user._id.toString())) {
      project.members.push(req.user._id);
    }

    // Remove from pendingInvites
    project.pendingInvites = project.pendingInvites.filter(
      (id) => id.toString() !== invitation._id.toString()
    );
    await project.save();

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    // Audit log
    createAuditLog({
      userId: req.user._id,
      tenantId: invitation.workspace,
      action: 'PROJECT_INVITE_ACCEPTED',
      description: `${req.user.name} accepted invitation to project "${project.name}"`,
      req,
      metadata: { projectId: project._id, invitationId: invitation._id }
    });

    res.json({ message: 'Invitation accepted! You are now a project member.', projectId: project._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Reject invitation ──────────────────────────────────────────────────────────
export const rejectInvite = async (req, res) => {
  try {
    const invitation = await ProjectInvitation.findOne({
      inviteToken: req.params.token,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    // Verify the logged-in user's email matches the invitation
    if (req.user.email.toLowerCase() !== invitation.invitedEmail) {
      return res.status(403).json({
        message: 'This invitation was sent to a different email address'
      });
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

    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get project invitations (admin) ────────────────────────────────────────────
export const getProjectInvitations = async (req, res) => {
  try {
    const projectId = req.params.id;

    const invitations = await ProjectInvitation.find({
      project: projectId,
      workspace: req.workspace
    })
      .populate('invitedBy', 'name email')
      .sort('-createdAt');

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Resend invitation ──────────────────────────────────────────────────────────
export const resendInvite = async (req, res) => {
  try {
    const invitation = await ProjectInvitation.findOne({
      _id: req.params.inviteId,
      project: req.params.id,
      workspace: req.workspace
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({ message: 'This invitation has already been accepted' });
    }

    // Reset the invitation
    invitation.status = 'pending';
    invitation.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await invitation.save();

    // Resend email
    const project = await Project.findById(invitation.project);
    const workspace = await Workspace.findById(req.workspace);
    const inviteLink = `${FRONTEND_URL}/invite/${invitation.inviteToken}`;

    try {
      await sendEmail(
        invitation.invitedEmail,
        `Reminder: You're invited to join "${project?.name}" on ScaleNest`,
        projectInvitationEmail(req.user.name, project?.name || 'Project', workspace?.name || 'Workspace', inviteLink)
      );
    } catch (emailError) {
      // Email failure is non-blocking
    }

    res.json({ message: 'Invitation resent successfully', invitation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get project members ────────────────────────────────────────────────────────
export const getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspace: req.workspace
    }).populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project.members);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
