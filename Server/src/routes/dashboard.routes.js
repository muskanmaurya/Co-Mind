import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getInsights } from '../controllers/dashboard.controller.js';

const dashboardRouter = express.Router();

// Apply authentication middleware to all dashboard routes
dashboardRouter.use(authMiddleware);

/**
 * GET /dashboard/insights
 * Get productivity insights and dashboard data
 * 
 * Returns:
 * - Total notes, active notes, archived notes
 * - Recently updated notes (last 5)
 * - Most-used tags (top 10)
 * - AI usage statistics (last 7 days)
 * - Weekly activity summary
 * 
 * Response (200):
 * {
 *   "message": "Insights retrieved successfully",
 *   "dashboard": {
 *     "summary": {
 *       "totalNotes": 42,
 *       "activeNotes": 38,
 *       "archivedNotes": 4
 *     },
 *     "recentlyUpdated": [...],
 *     "topTags": [
 *       { "name": "work", "usage": 15 },
 *       { "name": "personal", "usage": 12 }
 *     ],
 *     "aiUsage": {
 *       "totalRequests": 23,
 *       "byOperation": [
 *         { "operation": "generate-summary", "count": 23 }
 *       ]
 *     },
 *     "weeklyActivity": [
 *       { "date": "2026-05-10", "noteCount": 5 },
 *       { "date": "2026-05-11", "noteCount": 8 }
 *     ]
 *   }
 * }
 * 
 * Error responses:
 * 401: Unauthorized
 * 500: Server error
 */
dashboardRouter.get('/insights', getInsights);

export default dashboardRouter;
