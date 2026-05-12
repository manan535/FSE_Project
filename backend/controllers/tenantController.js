/**
 * Tenant Controller — Workspace branding & tenant onboarding APIs
 *
 * Handles workspace creation with branding, logo upload,
 * and tenant settings management.
 */

import Workspace from '../models/Workspace.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';
import { workspaceCreatedEmail } from '../templates/emailTemplates.js';
import { createAuditLog } from '../utils/auditLogger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Upload Logo ──────────────────────────────────────────────────────────────
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Build the public URL for the uploaded file
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    res.json({
      message: 'Logo uploaded successfully',
      url: logoUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// ─── Create Workspace with Branding ───────────────────────────────────────────
export const createWorkspaceWithBranding = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { name, tagline, themeColor, companyEmail, logo } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a workspace name' });
    }

    const workspace = await Workspace.create({
      name,
      owner: req.user._id,
      tagline: tagline || '',
      themeColor: themeColor || '#7c3aed',
      companyEmail: companyEmail || '',
      logo: logo || ''
    });

    // Create admin membership for the creator
    await Membership.create({
      user: req.user._id,
      workspace: workspace._id,
      role: 'admin'
    });

    // Set as current workspace
    await User.findByIdAndUpdate(req.user._id, {
      currentWorkspace: workspace._id
    });

    // Send workspace created email (fire-and-forget)
    sendEmail(
      req.user.email,
      '🏢 Workspace Created: ' + name,
      workspaceCreatedEmail(req.user.name, name)
    ).catch((err) => console.error('Workspace created email failed:', err.message));

    // Audit log
    createAuditLog({
      userId: req.user._id,
      tenantId: workspace._id,
      action: 'WORKSPACE_CREATED',
      description: `Workspace "${name}" created with branding`,
      req,
      metadata: { workspaceName: name, tagline, themeColor }
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error('🔥 Tenant create error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get Tenant Settings ──────────────────────────────────────────────────────
export const getTenantSettings = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspace;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId).select(
      'name logo tagline themeColor companyEmail inviteCode owner plan settings'
    );

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check membership
    const membership = await Membership.findOne({
      user: req.user._id,
      workspace: workspaceId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied to this workspace' });
    }

    res.json({
      ...workspace.toObject(),
      role: membership.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Update Tenant Settings (Admin Only) ──────────────────────────────────────
export const updateTenantSettings = async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspace;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check admin role
    const membership = await Membership.findOne({
      user: req.user._id,
      workspace: workspaceId,
      status: 'active'
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update branding settings' });
    }

    const { name, tagline, themeColor, companyEmail, logo } = req.body;

    // If logo is being changed and old logo exists, optionally delete old file
    if (logo !== undefined && workspace.logo && workspace.logo !== logo) {
      const oldLogoPath = path.join(__dirname, '..', workspace.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Update fields
    if (name) workspace.name = name;
    if (tagline !== undefined) workspace.tagline = tagline;
    if (themeColor) workspace.themeColor = themeColor;
    if (companyEmail !== undefined) workspace.companyEmail = companyEmail;
    if (logo !== undefined) workspace.logo = logo;

    const updatedWorkspace = await workspace.save();

    // Audit log
    createAuditLog({
      userId: req.user._id,
      tenantId: workspaceId,
      action: 'BRANDING_UPDATE',
      description: `Workspace branding updated`,
      req,
      metadata: { changes: req.body }
    });

    res.json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
