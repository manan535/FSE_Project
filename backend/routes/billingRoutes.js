import express from 'express';
import { getBillingInfo, upgradePlan, getInvoices, downloadInvoice, getUsageStats } from '../controllers/billingController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/info', protect, getBillingInfo);
router.post('/upgrade', protect, upgradePlan);
router.get('/usage', protect, getUsageStats);
router.get('/invoices', protect, getInvoices);
router.get('/invoices/:invoiceId/download', protect, downloadInvoice);

export default router;
