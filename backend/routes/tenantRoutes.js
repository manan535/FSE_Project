/**
 * Tenant Routes — Workspace branding & onboarding endpoints
 */

import express from 'express';
import {
  uploadLogo,
  createWorkspaceWithBranding,
  getTenantSettings,
  updateTenantSettings
} from '../controllers/tenantController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Logo upload (with Multer middleware)
router.post('/logo', protect, upload.single('logo'), uploadLogo);

// Create workspace with branding
router.post('/create', protect, createWorkspaceWithBranding);

// Get tenant/workspace settings (branding)
router.get('/settings', protect, getTenantSettings);

// Update tenant/workspace settings (admin only — role check inside controller)
router.put('/settings', protect, updateTenantSettings);

export default router;
