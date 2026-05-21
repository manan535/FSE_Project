import AuditLog from '../models/AuditLog.js';

// ─── GET /api/admin/audit-logs ──────────────────────────────────────────────────
// List audit logs with pagination, search, and filters
export const getAuditLogs = async (req, res) => {
  try {
    const workspaceId = req.workspace;
    const {
      page = 1,
      limit = 20,
      search = '',
      action = '',
      userId = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Build filter
    const filter = { tenantId: workspaceId };

    if (action) {
      filter.action = action;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/admin/audit-logs/stats ────────────────────────────────────────────
// Activity statistics
export const getAuditLogStats = async (req, res) => {
  try {
    const workspaceId = req.workspace;

    // Start of today (UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalLogs,
      todayLogs,
      actionBreakdown,
      recentUniqueUsers,
      topUsers
    ] = await Promise.all([
      // Total all-time
      AuditLog.countDocuments({ tenantId: workspaceId }),

      // Today's count
      AuditLog.countDocuments({ tenantId: workspaceId, createdAt: { $gte: todayStart } }),

      // Actions grouped by type
      AuditLog.aggregate([
        { $match: { tenantId: workspaceId } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Unique users in last 7 days
      AuditLog.distinct('userId', {
        tenantId: workspaceId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),

      // Most active users (top 5)
      AuditLog.aggregate([
        { $match: { tenantId: workspaceId } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            count: 1,
            'user.name': 1,
            'user.email': 1,
            'user.avatar': 1
          }
        }
      ])
    ]);

    // Find most common action
    const mostCommonAction = actionBreakdown.length > 0 ? actionBreakdown[0]._id : 'N/A';

    res.json({
      totalLogs,
      todayLogs,
      uniqueUsersLast7Days: recentUniqueUsers.length,
      mostCommonAction,
      actionBreakdown,
      topUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/admin/audit-logs/export ───────────────────────────────────────────
// Export logs as CSV
export const exportAuditLogs = async (req, res) => {
  try {
    const workspaceId = req.workspace;
    const { search = '', action = '', userId = '', startDate = '', endDate = '' } = req.query;

    const filter = { tenantId: workspaceId };
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    // Build CSV
    const headers = ['Date', 'User', 'Email', 'Action', 'Description', 'IP Address', 'Device'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.userId?.name || 'Unknown',
      log.userId?.email || 'N/A',
      log.action,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      log.ipAddress || '',
      `"${(log.device || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/admin/audit-logs/:id ──────────────────────────────────────────────
// Single log detail
export const getAuditLogById = async (req, res) => {
  try {
    const workspaceId = req.workspace;

    const log = await AuditLog.findOne({
      _id: req.params.id,
      tenantId: workspaceId
    })
      .populate('userId', 'name email avatar')
      .lean();

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
