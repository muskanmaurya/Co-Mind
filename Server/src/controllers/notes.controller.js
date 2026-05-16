import { randomUUID } from 'crypto';
import noteModel from '../models/notes.model.js';

/**
 * Verify note ownership helper
 * Ensures the note belongs to the authenticated user
 * 
 * @param {Object} note - The note document
 * @param {string} userId - The authenticated user's ID
 * @returns {boolean}
 */
const verifyOwnership = (note, userId) => {
  return note && note.userId.toString() === userId;
};

/**
 * Create a new note
 * POST /notes
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID from middleware
 * @param {Object} req.body - Request body
 * @param {string} req.body.title - Optional note title
 * @param {string} req.body.content - Optional note content
 * @param {Array} req.body.tags - Optional array of tags
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const createNote = async (req, res) => {
  try {
    const { title = 'Untitled', content = '', tags = [] } = req.body || {};
    const userId = req.user.id;

    // Validate input types
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Title must be a non-empty string' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ message: 'Content must be a string' });
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({ message: 'Tags must be an array' });
    }

    // Validate tags are strings
    if (tags.some(tag => typeof tag !== 'string')) {
      return res.status(400).json({ message: 'All tags must be strings' });
    }

    // Generate unique shareId for public sharing
    const shareId = randomUUID();

    // Create new note
    const newNote = await noteModel.create({
      userId,
      title: title.trim(),
      content: content.trim(),
      tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
      shareId,
      isPublic: false,
      isArchived: false,
    });

    return res.status(201).json({
      message: 'Note created successfully',
      note: newNote,
    });
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ message: 'Failed to create note' });
  }
};

/**
 * Get all notes for the authenticated user
 * GET /notes?tag=work&archived=true
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.tag - Optional tag filter
 * @param {string} req.query.archived - Optional archived filter (default: false)
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const getAllNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tag, archived } = req.query;

    // Build query filters
    const query = { userId };

    // Filter by archived status (default: exclude archived)
    const isArchived = archived === 'true';
    query.isArchived = isArchived;

    // Filter by tag if provided
    if (tag && typeof tag === 'string' && tag.trim().length > 0) {
      query.tags = { $in: [tag.trim()] };
    }

    // Fetch notes sorted by most recently updated first
    const notes = await noteModel
      .find(query)
      .sort({ updatedAt: -1 })
      .lean(); // Use lean() for better performance since we're not modifying

    return res.status(200).json({
      message: 'Notes retrieved successfully',
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error('Get all notes error:', error);
    return res.status(500).json({ message: 'Failed to retrieve notes' });
  }
};

/**
 * Update a note (optimized for auto-save)
 * PATCH /notes/:id
 * 
 * Supports partial updates: just send the fields you want to update
 * Example: { "content": "..." } or { "title": "New Title" } or { "tags": ["new", "tags"] }
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {string} req.params.id - Note ID to update
 * @param {Object} req.body - Partial update object
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body || {};

    // Validate note ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    // Whitelist allowed fields (prevent unauthorized field updates)
    const allowedFields = ['title', 'content', 'tags', 'isPublic', 'isArchived'];
    const filteredUpdate = {};

    for (const key of allowedFields) {
      if (key in updateData) {
        filteredUpdate[key] = updateData[key];
      }
    }

    // Validate field types
    if ('title' in filteredUpdate && (typeof filteredUpdate.title !== 'string' || filteredUpdate.title.trim().length === 0)) {
      return res.status(400).json({ message: 'Title must be a non-empty string' });
    }

    if ('content' in filteredUpdate && typeof filteredUpdate.content !== 'string') {
      return res.status(400).json({ message: 'Content must be a string' });
    }

    if ('tags' in filteredUpdate) {
      if (!Array.isArray(filteredUpdate.tags)) {
        return res.status(400).json({ message: 'Tags must be an array' });
      }
      if (filteredUpdate.tags.some(tag => typeof tag !== 'string')) {
        return res.status(400).json({ message: 'All tags must be strings' });
      }
    }

    if ('isPublic' in filteredUpdate && typeof filteredUpdate.isPublic !== 'boolean') {
      return res.status(400).json({ message: 'isPublic must be a boolean' });
    }

    if ('isArchived' in filteredUpdate && typeof filteredUpdate.isArchived !== 'boolean') {
      return res.status(400).json({ message: 'isArchived must be a boolean' });
    }

    // Trim string fields
    if ('title' in filteredUpdate) {
      filteredUpdate.title = filteredUpdate.title.trim();
    }
    if ('content' in filteredUpdate) {
      filteredUpdate.content = filteredUpdate.content.trim();
    }
    if ('tags' in filteredUpdate) {
      filteredUpdate.tags = filteredUpdate.tags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    // Fetch note to verify ownership
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // CRITICAL: Data Isolation - verify ownership
    if (!verifyOwnership(note, userId)) {
      return res.status(403).json({ message: 'You do not have permission to update this note' });
    }

    // Update note with runValidators and return updated doc
    const updatedNote = await noteModel.findByIdAndUpdate(
      id,
      filteredUpdate,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Note updated successfully',
      note: updatedNote,
    });
  } catch (error) {
    console.error('Update note error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    }

    return res.status(500).json({ message: 'Failed to update note' });
  }
};

/**
 * Delete/Archive a note
 * DELETE /notes/:id
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {string} req.params.id - Note ID to delete
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate note ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    // Fetch note to verify ownership before deletion
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // CRITICAL: Data Isolation - verify ownership
    if (!verifyOwnership(note, userId)) {
      return res.status(403).json({ message: 'You do not have permission to delete this note' });
    }

    // Delete note
    await noteModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Note deleted successfully',
      deletedNoteId: id,
    });
  } catch (error) {
    console.error('Delete note error:', error);
    return res.status(500).json({ message: 'Failed to delete note' });
  }
};

/**
 * Get a single note by ID
 * GET /notes/:id
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {string} req.params.id - Note ID
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const getNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate note ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // CRITICAL: Data Isolation - verify ownership
    if (!verifyOwnership(note, userId)) {
      return res.status(403).json({ message: 'You do not have permission to access this note' });
    }

    return res.status(200).json({
      message: 'Note retrieved successfully',
      note,
    });
  } catch (error) {
    console.error('Get note error:', error);
    return res.status(500).json({ message: 'Failed to retrieve note' });
  }
};

/**
 * Generate AI summary, action items, and suggested title
 * POST /notes/:id/generate-summary
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {string} req.params.id - Note ID
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const generateSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate note ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    // Import AI service
    const { generateAIMetadata, isContentAnalyzable } = await import('../services/ai.service.js');
    const aiUsageModel = (await import('../models/aiUsage.model.js')).default;

    // Fetch note
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // CRITICAL: Data Isolation - verify ownership
    if (!verifyOwnership(note, userId)) {
      return res.status(403).json({ message: 'You do not have permission to generate summary for this note' });
    }

    // Check if content is sufficient for analysis
    if (!isContentAnalyzable(note.content)) {
      return res.status(400).json({ 
        message: 'Note content must be at least 50 characters to generate AI metadata',
        requiredLength: 50,
        currentLength: note.content?.length || 0,
      });
    }

    // Generate AI metadata
    const aiMetadata = await generateAIMetadata(note.title, note.content);
    
    console.log('\n📊 CONTROLLER - AI Metadata received from service:');
    console.log(JSON.stringify(aiMetadata, null, 2));

    // Record AI usage
    await aiUsageModel.create({
      userId,
      noteId: id,
      operation: 'generate-summary',
      status: 'success',
      tokensUsed: 0, // Could calculate from API response if needed
    });

    // Update note with AI metadata
    const updatedNote = await noteModel.findByIdAndUpdate(
      id,
      { aiMetadata },
      { new: true }
    );
    
    console.log('\n💾 CONTROLLER - Updated note with aiMetadata:');
    console.log(JSON.stringify(updatedNote.aiMetadata, null, 2));
    console.log('\n');

    return res.status(200).json({
      message: 'AI summary generated successfully',
      aiMetadata,
      note: updatedNote,
    });
  } catch (error) {
    console.error('Generate summary error:', error);

    // Record failed AI usage
    try {
      const { id } = req.params;
      const aiUsageModel = (await import('../models/aiUsage.model.js')).default;
      await aiUsageModel.create({
        userId: req.user.id,
        noteId: id,
        operation: 'generate-summary',
        status: 'failed',
        error: error.message,
      });
    } catch (logError) {
      console.error('Failed to log AI usage error:', logError);
    }

    return res.status(500).json({ message: 'Failed to generate AI summary' });
  }
};
