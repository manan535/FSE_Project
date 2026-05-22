import mongoose from 'mongoose';
import crypto from 'crypto';

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a workspace name'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'pro_plus', 'super_pro_max'],
    default: 'free'
  },
  planStartDate: {
    type: Date,
    default: null
  },
  planEndDate: {
    type: Date,
    default: null
  },
  settings: {
    allowInvites: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 5
    }
  },
  // ─── Branding / Tenant fields ──────────────────────────────────────────────
  logo: {
    type: String,
    default: ''
  },
  tagline: {
    type: String,
    default: '',
    maxlength: [120, 'Tagline cannot exceed 120 characters']
  },
  themeColor: {
    type: String,
    default: '#7c3aed'
  },
  companyEmail: {
    type: String,
    default: '',
    lowercase: true
  }
}, {
  timestamps: true
});

workspaceSchema.pre('save', async function () {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  }
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(8).toString('hex');
  }
});

export default mongoose.model('Workspace', workspaceSchema);