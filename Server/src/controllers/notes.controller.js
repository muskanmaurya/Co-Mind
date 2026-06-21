import { randomUUID } from 'crypto';
import noteModel from '../models/notes.model.js';
import invitationModel from '../models/invitation.model.js';
import { sendInvitationEmail } from '../services/email.service.js';

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

const normalizeEmail = (email = '') => String(email).toLowerCase().trim();

const getCollaboratorRecord = (note, userEmail) => {
  const normalizedEmail = normalizeEmail(userEmail);
  if (!normalizedEmail || !Array.isArray(note?.collaborators)) return null;

  return note.collaborators.find(
    (collaborator) => normalizeEmail(collaborator.email) === normalizedEmail
  ) || null;
};

const canReadNote = (note, userId, userEmail) => {
  if (verifyOwnership(note, userId)) return true;
  return Boolean(getCollaboratorRecord(note, userEmail));
};

const canEditNote = (note, userId, userEmail) => {
  if (verifyOwnership(note, userId)) return true;
  const collaborator = getCollaboratorRecord(note, userEmail);
  return collaborator?.role === 'editor';
};

const normalizeActionItems = (actionItems = []) => {
  if (!Array.isArray(actionItems)) return [];

  return actionItems
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim();
        return text ? { text, isCompleted: false } : null;
      }

      if (!item || typeof item !== 'object') return null;

      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) return null;

      return {
        text,
        isCompleted: Boolean(item.isCompleted),
      };
    })
    .filter(Boolean);
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
    const { title = 'Untitled', content = '', category = 'Personal', tags = [] } = req.body || {};
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

    if (typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ message: 'Category must be a non-empty string' });
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
      category: category.trim(),
      tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
      shareId,
      collaborators: [],
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
    const userEmail = req.user.email;
    const { tag, archived, category } = req.query;

    // Build query filters
    const query = {
      $or: [
        { userId },
        { 'collaborators.email': normalizeEmail(userEmail) },
      ],
    };

    // Filter by archived status (default: exclude archived)
    const isArchived = archived === 'true';
    query.isArchived = isArchived;

    // Filter by tag if provided
    if (tag && typeof tag === 'string' && tag.trim().length > 0) {
      query.tags = { $in: [tag.trim()] };
    }

    if (category && typeof category === 'string' && category.trim().length > 0) {
      query.category = category.trim();
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
    const userEmail = req.user.email;
    const updateData = req.body || {};

    // Validate note ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    // Whitelist allowed fields (prevent unauthorized field updates)
    const allowedFields = ['title', 'content', 'category', 'tags', 'isPublic', 'isArchived', 'aiMetadata'];
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

    if ('category' in filteredUpdate && (typeof filteredUpdate.category !== 'string' || filteredUpdate.category.trim().length === 0)) {
      return res.status(400).json({ message: 'Category must be a non-empty string' });
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

    if ('aiMetadata' in filteredUpdate) {
      const metadata = filteredUpdate.aiMetadata;
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return res.status(400).json({ message: 'aiMetadata must be an object' });
      }

      const normalizedActionItems = normalizeActionItems(metadata.actionItems || metadata.action_items || []);
      filteredUpdate.aiMetadata = {
        summary: typeof metadata.summary === 'string' ? metadata.summary.trim() : '',
        actionItems: normalizedActionItems,
        suggestedTitle: typeof metadata.suggestedTitle === 'string'
          ? metadata.suggestedTitle.trim()
          : typeof metadata.suggested_title === 'string'
            ? metadata.suggested_title.trim()
            : undefined,
      };
    }

    // Trim string fields
    if ('title' in filteredUpdate) {
      filteredUpdate.title = filteredUpdate.title.trim();
    }
    if ('content' in filteredUpdate) {
      filteredUpdate.content = filteredUpdate.content.trim();
    }
    if ('category' in filteredUpdate) {
      filteredUpdate.category = filteredUpdate.category.trim();
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
    if (!canEditNote(note, userId, userEmail)) {
      return res.status(403).json({ message: 'You do not have edit permission for this note' });
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
    const userEmail = req.user.email;

    // Validate note ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // CRITICAL: Data Isolation - verify ownership
    if (!canReadNote(note, userId, userEmail)) {
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
    const userEmail = req.user.email;

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
    if (!canEditNote(note, userId, userEmail)) {
      return res.status(403).json({ message: 'You do not have edit permission to generate summary for this note' });
    }

    // Check if content is sufficient for analysis
    if (!isContentAnalyzable(note.content)) {
      return res.status(400).json({ 
        message: 'Note content must be at least 50 characters to generate AI metadata',
        requiredLength: 50,
        currentLength: note.content?.length || 0,
      });
    }

    // Generate AI metadata and normalize it to the schema shape before saving
    const rawAiMetadata = await generateAIMetadata(note.title, note.content);
    const aiMetadata = {
      summary: rawAiMetadata?.summary || '',
      actionItems: normalizeActionItems(rawAiMetadata?.action_items || rawAiMetadata?.actionItems || []),
      suggestedTitle: rawAiMetadata?.suggested_title || rawAiMetadata?.suggestedTitle || note.title,
    };
    
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
      { $set: { aiMetadata } },
      { new: true, runValidators: true }
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

export const inviteCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
    const ownerName = req.user.name || 'Someone';
    const { email, role = 'editor' } = req.body || {};

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const allowedRoles = ['editor', 'viewer'];

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'A valid collaborator email is required' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be editor or viewer' });
    }

    const note = await noteModel.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (!verifyOwnership(note, ownerId)) {
      return res.status(403).json({ message: 'Only the owner can invite collaborators' });
    }

    const existingIndex = (note.collaborators || []).findIndex(
      (collaborator) => normalizeEmail(collaborator.email) === normalizedEmail
    );

    if (existingIndex >= 0) {
      note.collaborators[existingIndex].role = role;
    } else {
      note.collaborators.push({ email: normalizedEmail, role });
    }

    await note.save();

    // Create or update invitation record
    const invitationToken = randomUUID();
    try {
      await invitationModel.findOneAndUpdate(
        { noteId: id, invitedEmail: normalizedEmail },
        {
          noteId: id,
          invitedEmail: normalizedEmail,
          invitedBy: ownerId,
          role,
          status: 'pending',
          invitationToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        { upsert: true, new: true }
      );

      // Send invitation email
      const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:5173/signup'}?invitedFor=${note.title.replace(/\s+/g, '+')}&inviteEmail=${normalizedEmail}`;
      const emailResult = await sendInvitationEmail(
        normalizedEmail,
        note.title,
        ownerName,
        invitationLink,
        role
      );

      console.log(`✉️ Invitation email sent to ${normalizedEmail} for note: ${note.title}`);

      return res.status(200).json({
        message: 'Invitation email sent successfully! Collaborator will gain access upon signing up or logging in.',
        note,
        emailSent: true,
        emailDeliveryId: emailResult?.data?.id || emailResult?.id || null,
      });
    } catch (emailError) {
      console.error('Email send failed but collaborator was added:', emailError);
      return res.status(200).json({
        message: 'Collaborator added, but email notification failed',
        note,
        emailError: true,
        emailErrorMessage: emailError?.message || 'Unknown email provider error',
      });
    }

  } catch (error) {
    console.error('Invite collaborator error:', error);
    return res.status(500).json({ message: 'Failed to send invitation: ' + error.message });
  }
};
