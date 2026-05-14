/**
 * Alert Routes
 *
 * Endpoints for task deadline alerts and manual deadline checking.
 * Protected with JWT auth + workspace access check.
 */

import express from 'express';
import { getTaskAlerts, triggerDeadlineCheck } from '../controllers/alertController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(checkWorkspaceAccess);

// GET  /api/alerts/tasks            — Fetch overdue and upcoming task alerts
router.get('/tasks', getTaskAlerts);

// POST /api/alerts/check-deadlines  — Manually trigger deadline check
router.post('/check-deadlines', triggerDeadlineCheck);

export default router;
