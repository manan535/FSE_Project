import express from 'express';
import {
  getAuditLogs,
  getAuditLogStats,
  exportAuditLogs,
  getAuditLogById
} from '../controllers/auditLogController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess, requireRole } from '../middlewares/tenant.js';

const router = express.Router();

// All routes require authentication + workspace access + admin role
router.use(protect, checkWorkspaceAccess, requireRole(['admin']));

router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/stats', getAuditLogStats);
router.get('/audit-logs/export', exportAuditLogs);
router.get('/audit-logs/:id', getAuditLogById);

export default router;
