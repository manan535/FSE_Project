import express from 'express';
import {
  sendProjectInvite,
  getProjectInvitations,
  getInviteInfo,
  acceptInvite,
  rejectInvite,
  resendInvite,
  getProjectMembers
} from '../controllers/invitationController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

// Public route — anyone can view invite info (for the accept page)
router.get('/invite/info/:token', getInviteInfo);

// Auth-required routes for accept/reject (no workspace check needed)
router.post('/invite/accept/:token', protect, acceptInvite);
router.post('/invite/reject/:token', protect, rejectInvite);

// Workspace-scoped project invitation management (admin)
router.post('/projects/:id/invite', protect, checkWorkspaceAccess, sendProjectInvite);
router.get('/projects/:id/invitations', protect, checkWorkspaceAccess, getProjectInvitations);
router.post('/projects/:id/invite/:inviteId/resend', protect, checkWorkspaceAccess, resendInvite);
router.get('/projects/:id/members', protect, checkWorkspaceAccess, getProjectMembers);

export default router;
