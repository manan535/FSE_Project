import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/auth.js';
import { checkWorkspaceAccess } from '../middlewares/tenant.js';

const router = express.Router();

router.use(protect);
router.use(checkWorkspaceAccess);

router.get('/', getAnalytics);

export default router;
