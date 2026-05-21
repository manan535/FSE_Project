import AuditLog from '../models/AuditLog.js';

/**
 * Create an audit log entry (fire-and-forget).
 *
 * @param {Object} options
 * @param {string} options.userId      - The user who performed the action
 * @param {string} options.tenantId    - The workspace / tenant ID
 * @param {string} options.action      - Action enum value (e.g. 'LOGIN')
 * @param {string} options.description - Human-readable explanation
 * @param {Object} [options.req]       - Express request object (used to extract IP + UA)
 * @param {Object} [options.metadata]  - Any extra data to store
 */
export const createAuditLog = async ({ userId, tenantId, action, description, req, metadata = {} }) => {
  try {
    if (!userId || !tenantId || !action || !description) {
      return;
    }

    const ipAddress = req
      ? req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || ''
      : '';

    const device = req
      ? req.headers['user-agent'] || ''
      : '';

    await AuditLog.create({
      userId,
      tenantId,
      action,
      description,
      ipAddress,
      device,
      metadata
    });
  } catch (error) {
    // Never let audit logging break the main flow
  }
};
