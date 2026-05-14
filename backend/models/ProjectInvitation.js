import mongoose from 'mongoose';
import crypto from 'crypto';

const projectInvitationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  inviteToken: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  role: {
    type: String,
    enum: ['member', 'viewer'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  }
}, {
  timestamps: true
});

projectInvitationSchema.index({ project: 1, status: 1 });
projectInvitationSchema.index({ invitedEmail: 1, status: 1 });

export default mongoose.model('ProjectInvitation', projectInvitationSchema);
