import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    plan: {
      type: String,
      enum: ['free', 'monthly', 'quarterly', 'yearly'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'past_due'],
      default: 'active',
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one active subscription per workspace
subscriptionSchema.index(
  { workspace: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

export default mongoose.model('Subscription', subscriptionSchema);
