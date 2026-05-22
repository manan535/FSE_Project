import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'USER_CREATED',
      'USER_DELETED',
      'SETTINGS_UPDATE',
      'PASSWORD_CHANGE',
      'ROLE_UPDATE',
      'API_ACCESS',
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_DELETED',
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_DELETED',
      'MEMBER_ADDED',
      'MEMBER_REMOVED',
      'PROJECT_INVITE_SENT',
      'PROJECT_INVITE_ACCEPTED'
    ]
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  device: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient tenant-scoped queries sorted by time
auditLogSchema.index({ tenantId: 1, createdAt: -1 });

// Text index on description for search
auditLogSchema.index({ description: 'text' });

// Index on action for filtering
auditLogSchema.index({ action: 1 });

// Index on userId for filtering by user
auditLogSchema.index({ userId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
