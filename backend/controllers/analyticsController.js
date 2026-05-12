import Task from '../models/Task.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';

// @desc    Get workspace analytics
// @route   GET /api/analytics
// @access  Private (workspace member)
export const getAnalytics = async (req, res) => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.workspace);

    // Run all aggregations in parallel for performance
    const [taskDistribution, teamPerformance, productivityData, summaryStats] = await Promise.all([
      // 1. Task Distribution - count tasks by status
      Task.aggregate([
        { $match: { workspace: workspaceId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // 2. Team Performance - completed tasks per assignee
      Task.aggregate([
        {
          $match: {
            workspace: workspaceId,
            status: 'done'
          }
        },
        { $unwind: '$assignees' },
        {
          $group: {
            _id: '$assignees',
            completed: { $sum: 1 }
          }
        },
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
            _id: 0,
            name: '$user.name',
            completed: 1
          }
        },
        { $sort: { completed: -1 } },
        { $limit: 10 }
      ]),

      // 3. Productivity Trend - tasks completed & projects created per month (last 6 months)
      (async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const [tasksByMonth, projectsByMonth] = await Promise.all([
          Task.aggregate([
            {
              $match: {
                workspace: workspaceId,
                status: 'done',
                updatedAt: { $gte: sixMonthsAgo }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$updatedAt' },
                  month: { $month: '$updatedAt' }
                },
                tasks: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ]),

          Project.aggregate([
            {
              $match: {
                workspace: workspaceId,
                createdAt: { $gte: sixMonthsAgo }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                projects: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ])
        ]);

        // Build a map for the last 6 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            label: monthNames[d.getMonth()]
          });
        }

        return months.map(({ year, month, label }) => {
          const taskEntry = tasksByMonth.find(t => t._id.year === year && t._id.month === month);
          const projectEntry = projectsByMonth.find(p => p._id.year === year && p._id.month === month);
          return {
            month: label,
            tasks: taskEntry ? taskEntry.tasks : 0,
            projects: projectEntry ? projectEntry.projects : 0
          };
        });
      })(),

      // 4. Summary stats
      (async () => {
        const [totalTasks, totalProjects, completedTasks, activeTasks] = await Promise.all([
          Task.countDocuments({ workspace: workspaceId }),
          Project.countDocuments({ workspace: workspaceId }),
          Task.countDocuments({ workspace: workspaceId, status: 'done' }),
          Task.countDocuments({ workspace: workspaceId, status: 'in_progress' })
        ]);

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          totalTasks,
          totalProjects,
          completedTasks,
          activeTasks,
          completionRate
        };
      })()
    ]);

    // Format task distribution
    const statusMap = {
      done: 'Completed',
      in_progress: 'In Progress',
      todo: 'Todo'
    };

    const formattedDistribution = ['done', 'in_progress', 'todo'].map(status => {
      const found = taskDistribution.find(t => t._id === status);
      return {
        name: statusMap[status],
        value: found ? found.count : 0
      };
    });

    res.json({
      taskDistribution: formattedDistribution,
      teamPerformance,
      productivityData,
      summary: summaryStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};
