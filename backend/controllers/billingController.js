import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import mongoose from 'mongoose';

// ─── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    period: 'forever',
    maxMembers: 5,
    maxStorage: 5, // GB
    features: [
      'Up to 5 team members',
      'Basic project management',
      '5 GB storage',
      'Email support',
    ],
  },
  monthly: {
    name: 'Monthly',
    price: 29,
    period: 'per month',
    maxMembers: 50,
    maxStorage: 100,
    features: [
      'Up to 50 team members',
      'Advanced features',
      '100 GB storage',
      'Priority support',
    ],
  },
  quarterly: {
    name: 'Quarterly',
    price: 79,
    period: 'per quarter',
    maxMembers: 100,
    maxStorage: 500,
    savings: 'Save 9%',
    features: [
      'Up to 100 team members',
      'All Monthly features',
      '500 GB storage',
      '24/7 support',
    ],
  },
  yearly: {
    name: 'Yearly',
    price: 299,
    period: 'per year',
    maxMembers: Infinity,
    maxStorage: Infinity,
    savings: 'Save 14%',
    features: [
      'Unlimited members',
      'All features',
      'Unlimited storage',
      'Dedicated support',
    ],
  },
};

// @desc    Get available plans
// @route   GET /api/billing/plans
// @access  Private
export const getPlans = (req, res) => {
  const planList = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    ...plan,
  }));
  res.json(planList);
};

// @desc    Get current subscription for workspace
// @route   GET /api/billing/subscription
// @access  Private (workspace member)
export const getCurrentSubscription = async (req, res) => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.workspace);

    let subscription = await Subscription.findOne({
      workspace: workspaceId,
      status: 'active',
    });

    // If no subscription exists, return a default free plan
    if (!subscription) {
      subscription = {
        plan: 'free',
        status: 'active',
        amount: 0,
        currency: 'USD',
        startDate: new Date(),
        endDate: null,
      };
    }

    const planDetails = PLANS[subscription.plan] || PLANS.free;

    res.json({
      subscription,
      planDetails,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch subscription', error: error.message });
  }
};

// @desc    Create or upgrade subscription
// @route   POST /api/billing/subscription
// @access  Private (workspace member)
export const createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const workspaceId = new mongoose.Types.ObjectId(req.workspace);

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        message: 'Invalid plan. Choose from: free, monthly, quarterly, yearly',
      });
    }

    // Cancel any existing active subscription
    await Subscription.updateMany(
      { workspace: workspaceId, status: 'active' },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    // Calculate end date based on plan
    const startDate = new Date();
    let endDate = null;

    if (plan !== 'free') {
      endDate = new Date(startDate);
      switch (plan) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
    }

    const subscription = await Subscription.create({
      workspace: workspaceId,
      plan,
      status: 'active',
      amount: PLANS[plan].price,
      startDate,
      endDate,
    });

    // Create an invoice for paid plans
    if (PLANS[plan].price > 0) {
      const invoiceCount = await Invoice.countDocuments();
      await Invoice.create({
        workspace: workspaceId,
        subscription: subscription._id,
        invoiceNumber: `INV-${String(invoiceCount + 1).padStart(4, '0')}`,
        amount: PLANS[plan].price,
        status: 'paid',
        billingDate: new Date(),
        paidAt: new Date(),
        description: `${PLANS[plan].name} plan subscription`,
      });
    }

    res.status(201).json({
      message: `Successfully subscribed to ${PLANS[plan].name} plan`,
      subscription,
      planDetails: PLANS[plan],
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res
      .status(500)
      .json({
        message: 'Failed to create subscription',
        error: error.message,
      });
  }
};

// @desc    Cancel subscription
// @route   DELETE /api/billing/subscription
// @access  Private (workspace member)
export const cancelSubscription = async (req, res) => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.workspace);

    const subscription = await Subscription.findOne({
      workspace: workspaceId,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    if (subscription.plan === 'free') {
      return res
        .status(400)
        .json({ message: 'Cannot cancel free plan' });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    // Revert to free plan
    await Subscription.create({
      workspace: workspaceId,
      plan: 'free',
      status: 'active',
      amount: 0,
      startDate: new Date(),
    });

    res.json({ message: 'Subscription cancelled. Reverted to free plan.' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res
      .status(500)
      .json({
        message: 'Failed to cancel subscription',
        error: error.message,
      });
  }
};

// @desc    Get invoices for workspace
// @route   GET /api/billing/invoices
// @access  Private (workspace member)
export const getInvoices = async (req, res) => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.workspace);

    const invoices = await Invoice.find({ workspace: workspaceId })
      .sort({ billingDate: -1 })
      .limit(50)
      .lean();

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch invoices', error: error.message });
  }
};

// @desc    Get workspace usage stats
// @route   GET /api/billing/usage
// @access  Private (workspace member)
export const getUsage = async (req, res) => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.workspace);

    // Get active subscription to determine limits
    const subscription = await Subscription.findOne({
      workspace: workspaceId,
      status: 'active',
    });

    const plan = subscription ? subscription.plan : 'free';
    const planDetails = PLANS[plan] || PLANS.free;

    // Count workspace members (try to find Workspace model, fallback to defaults)
    let memberCount = 0;
    let storageUsed = 0;

    try {
      const Workspace = mongoose.model('Workspace');
      const workspace = await Workspace.findById(workspaceId);
      if (workspace && workspace.members) {
        memberCount = workspace.members.length;
      }
    } catch {
      // Workspace model may not exist yet — use defaults
      memberCount = 0;
    }

    res.json({
      plan,
      members: {
        used: memberCount,
        limit: planDetails.maxMembers === Infinity ? 'Unlimited' : planDetails.maxMembers,
        percentage:
          planDetails.maxMembers === Infinity
            ? 0
            : Math.round((memberCount / planDetails.maxMembers) * 100),
      },
      storage: {
        used: storageUsed,
        limit: planDetails.maxStorage === Infinity ? 'Unlimited' : planDetails.maxStorage,
        percentage:
          planDetails.maxStorage === Infinity
            ? 0
            : Math.round((storageUsed / planDetails.maxStorage) * 100),
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch usage', error: error.message });
  }
};
