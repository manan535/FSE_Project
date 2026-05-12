import express from 'express';
import {
  getPlans,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
  getInvoices,
  getUsage,
} from '../controllers/billingController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

// All billing routes require authentication
router.use(protect);

// Plans can be viewed without workspace context
router.get('/plans', getPlans);

// Workspace-scoped routes
router.use(checkWorkspaceAccess);

router.get('/subscription', getCurrentSubscription);
router.post('/subscription', createSubscription);
router.delete('/subscription', cancelSubscription);
router.get('/invoices', getInvoices);
router.get('/usage', getUsage);

export default router;
