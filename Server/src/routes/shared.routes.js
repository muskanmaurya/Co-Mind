import express from 'express';
import { getPublicNote, updateVisibility } from '../controllers/shared.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const sharedRouter = express.Router();

/**
 * GET /shared/:shareId
 * Get a publicly shared note (PUBLIC - no authentication required)
 * 
 * Response (200):
 * {
 *   "message": "Shared note retrieved successfully",
 *   "note": {
 *     "title": "...",
 *     "content": "...",
 *     "tags": ["..."],
 *     "aiMetadata": {...},
 *     "createdAt": "...",
 *     "updatedAt": "..."
 *   }
 * }
 * 
 * Error responses:
 * 400: Invalid share ID
 * 404: Note not found or is not public
 * 500: Server error
 */
sharedRouter.get('/:shareId', getPublicNote);

/**
 * PATCH /shared/:id/visibility
 * Update note visibility (public/private) - AUTHENTICATED
 * 
 * Request body:
 * {
 *   "isPublic": true
 * }
 * 
 * Response (200):
 * {
 *   "message": "Note is now public",
 *   "shareId": "UUID",
 *   "note": {...}
 * }
 * 
 * Error responses:
 * 400: Invalid isPublic value
 * 401: Unauthorized
 * 403: Note belongs to another user
 * 404: Note not found
 * 500: Server error
 */
sharedRouter.patch('/:id/visibility', authMiddleware, updateVisibility);

export default sharedRouter;
