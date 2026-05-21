import Membership from '../models/Membership.js';

/**
 * Workspace access middleware
 * Reads workspace from x-workspace-id
 * Verifies user membership
 */
export const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const workspaceId =
      req.headers['x-workspace-id'] ||
      req.body.workspace ||
      req.query.workspace;

    if (!workspaceId) {
      return res.status(400).json({
        message: 'Workspace ID is required (x-workspace-id header)'
      });
    }

    const membership = await Membership.findOne({
      user: req.user._id,
      workspace: workspaceId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        message: 'Access denied to this workspace'
      });
    }

    req.workspace = workspaceId;
    req.userRole = membership.role;

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};