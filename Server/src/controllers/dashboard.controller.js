import noteModel from '../models/notes.model.js';
import aiUsageModel from '../models/aiUsage.model.js';

/**
 * Get productivity insights and dashboard data for authenticated user
 * GET /dashboard/insights
 * 
 * Returns:
 * - Total notes
 * - Recently edited notes
 * - Most-used tags
 * - AI usage statistics
 * - Weekly activity summary
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get total notes count
    const totalNotes = await noteModel.countDocuments({ userId });

    // Get archived notes count
    const archivedNotes = await noteModel.countDocuments({ userId, isArchived: true });

    // Get active notes count
    const activeNotes = totalNotes - archivedNotes;

    // Get recently updated notes (last 5)
    const recentlyUpdated = await noteModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('_id title updatedAt tags')
      .lean();

    // Get most-used tags
    const tagStats = await noteModel.aggregate([
      {
        $match: { userId: { $oid: userId } },
      },
      {
        $unwind: '$tags',
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Get AI usage stats
    const aiUsageCount = await aiUsageModel.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const aiUsageByOperation = await aiUsageModel.aggregate([
      {
        $match: {
          userId: { $oid: userId },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$operation',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get weekly activity (notes created/updated per day)
    const weeklyActivity = await noteModel.aggregate([
      {
        $match: {
          userId: { $oid: userId },
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$updatedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return res.status(200).json({
      message: 'Insights retrieved successfully',
      dashboard: {
        summary: {
          totalNotes,
          activeNotes,
          archivedNotes,
        },
        recentlyUpdated: recentlyUpdated.map(note => ({
          id: note._id,
          title: note.title,
          updatedAt: note.updatedAt,
          tags: note.tags,
        })),
        topTags: tagStats.map(tag => ({
          name: tag._id,
          usage: tag.count,
        })),
        aiUsage: {
          totalRequests: aiUsageCount,
          byOperation: aiUsageByOperation.map(op => ({
            operation: op._id,
            count: op.count,
          })),
        },
        weeklyActivity: weeklyActivity.map(day => ({
          date: day._id,
          noteCount: day.count,
        })),
      },
    });
  } catch (error) {
    console.error('Get insights error:', error);
    return res.status(500).json({ message: 'Failed to retrieve insights' });
  }
};

/**
 * Search notes by keyword
 * GET /notes/search?q=keyword
 * 
 * Searches across title and content fields
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.q - Search keyword (required)
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const searchNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search keyword is required' });
    }

    const searchTerm = q.trim();

    // Search using MongoDB regex for case-insensitive search
    const notes = await noteModel
      .find({
        userId,
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
        ],
      })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      message: 'Search results retrieved successfully',
      query: searchTerm,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error('Search notes error:', error);
    return res.status(500).json({ message: 'Failed to search notes' });
  }
};
