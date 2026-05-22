import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  invoiceId: {
    type: String,
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'pro_plus', 'super_pro_max'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'refunded'],
    default: 'paid'
  },
  description: {
    type: String,
    default: ''
  },
  period: {
    start: { type: Date },
    end: { type: Date }
  }
}, {
  timestamps: true
});

export default mongoose.model('Invoice', invoiceSchema);
