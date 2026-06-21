import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  createNote,
  getAllNotes,
  getNote,
  updateNote,
  deleteNote,
  generateSummary,
  inviteCollaborator,
} from '../controllers/notes.controller.js';
import { searchNotes } from '../controllers/dashboard.controller.js';

const notesRouter = express.Router();

// Apply authentication middleware to all routes in this router
notesRouter.use(authMiddleware);

/**
 * POST /notes
 * Create a new note for the authenticated user
 * 
 * Request body:
 * {
 *   "title": "string (optional, defaults to 'Untitled')",
 *   "content": "string (optional, defaults to '')",
 *   "tags": ["array", "of", "strings"] (optional)
 * }
 * 
 * Response (201):
 * {
 *   "message": "Note created successfully",
 *   "note": {
 *     "_id": "ObjectId",
 *     "userId": "ObjectId",
 *     "title": "string",
 *     "content": "string",
 *     "tags": ["array"],
 *     "shareId": "UUID",
 *     "isPublic": false,
 *     "isArchived": false,
 *     "createdAt": "ISO date",
 *     "updatedAt": "ISO date"
 *   }
 * }
 * 
 * Error responses:
 * 400: Validation errors
 * 401: Unauthorized (missing/invalid token)
 * 500: Server error
 */
notesRouter.post('/', createNote);

/**
 * GET /notes
 * Retrieve all notes for the authenticated user
 * 
 * Query parameters:
 * ?tag=work - Filter notes by specific tag
 * ?archived=true - Include archived notes (default: false, excludes archived)
 * 
 * Response (200):
 * {
 *   "message": "Notes retrieved successfully",
 *   "count": 5,
 *   "notes": [{ note objects sorted by updatedAt DESC }]
 * }
 * 
 * Error responses:
 * 401: Unauthorized
 * 500: Server error
 */
notesRouter.get('/', getAllNotes);

/**
 * GET /notes/search?q=keyword
 * Search notes by keyword across title and content
 * 
 * Query parameters:
 * ?q=keyword - Search term (required)
 * 
 * Response (200):
 * {
 *   "message": "Search results retrieved successfully",
 *   "query": "keyword",
 *   "count": 3,
 *   "notes": [...]
 * }
 * 
 * Error responses:
 * 400: Missing search keyword
 * 401: Unauthorized
 * 500: Server error
 */
notesRouter.get('/search', searchNotes);

/**
 * GET /notes/:id
 * Retrieve a single note by ID (must belong to authenticated user)
 * 
 * Response (200):
 * {
 *   "message": "Note retrieved successfully",
 *   "note": { note object }
 * }
 * 
 * Error responses:
 * 400: Invalid note ID
 * 401: Unauthorized
 * 403: Note belongs to another user
 * 404: Note not found
 * 500: Server error
 */
notesRouter.get('/:id', getNote);

/**
 * PATCH /notes/:id
 * Update a note (optimized for auto-save)
 * 
 * Supports partial updates - send only the fields you want to modify:
 * {
 *   "title": "new title",
 *   "content": "updated content",
 *   "tags": ["tag1", "tag2"],
 *   "isPublic": true,
 *   "isArchived": false
 * }
 * 
 * Response (200):
 * {
 *   "message": "Note updated successfully",
 *   "note": { updated note object }
 * }
 * 
 * Error responses:
 * 400: Validation errors or invalid note ID
 * 401: Unauthorized
 * 403: Note belongs to another user
 * 404: Note not found
 * 500: Server error
 */
notesRouter.patch('/:id', updateNote);

/**
 * DELETE /notes/:id
 * Delete a note (must belong to authenticated user)
 * 
 * Response (200):
 * {
 *   "message": "Note deleted successfully",
 *   "deletedNoteId": "ObjectId"
 * }
 * 
 * Error responses:
 * 400: Invalid note ID
 * 401: Unauthorized
 * 403: Note belongs to another user
 * 404: Note not found
 * 500: Server error
 */
notesRouter.delete('/:id', deleteNote);

/**
 * POST /notes/:id/generate-summary
 * Generate AI metadata (summary, action items, suggested title) for a note
 * 
 * Response (200):
 * {
 *   "message": "AI summary generated successfully",
 *   "aiMetadata": {
 *     "summary": "...",
 *     "action_items": ["...", "..."],
 *     "suggested_title": "..."
 *   },
 *   "note": { updated note object }
 * }
 * 
 * Error responses:
 * 400: Content too short for analysis
 * 401: Unauthorized
 * 403: Note belongs to another user
 * 404: Note not found
 * 500: Server error
 */
notesRouter.post('/:id/generate-summary', generateSummary);
notesRouter.post('/:id/invite', inviteCollaborator);

export default notesRouter;
