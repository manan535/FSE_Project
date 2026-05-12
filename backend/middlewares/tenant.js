/**
 * Workspace access middleware – reads x-workspace-id header
 * and attaches it to req.workspace for downstream controllers.
 *
 * NOTE: In a full multi-tenant system you would also verify the user
 * is actually a member of the workspace. For now we trust the header
 * since the protect middleware already validates the user's identity.
 */
export const checkWorkspaceAccess = (req, res, next) => {
  const workspaceId =
    req.headers['x-workspace-id'] || req.query.workspace || null;

  if (!workspaceId) {
    return res
      .status(400)
      .json({ message: 'Workspace ID is required (x-workspace-id header)' });
  }

  req.workspace = workspaceId;
  next();
};
