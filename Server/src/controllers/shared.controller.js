import noteModel from '../models/notes.model.js';

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

      return { text, isCompleted: Boolean(item.isCompleted) };
    })
    .filter(Boolean);
};

/**
 * Get a publicly shared note by shareId
 * GET /shared/:shareId
 * 
 * This endpoint is public - no authentication required
 * Returns only if the note is marked as public
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.shareId - Unique share ID
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const getPublicNote = async (req, res) => {
  try {
    const { shareId } = req.params;

    // Validate shareId
    if (!shareId || typeof shareId !== 'string' || shareId.trim().length === 0) {
      return res.status(400).json({ message: 'Valid share ID is required' });
    }

    // Find note by shareId and verify it's public
    const note = await noteModel.findOne({
      shareId: shareId.trim(),
      isPublic: true,
    });

    if (!note) {
      return res.status(404).json({ 
        message: 'Shared note not found or is not public',
      });
    }

    // Return note without revealing userId for privacy
    return res.status(200).json({
      message: 'Shared note retrieved successfully',
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        aiMetadata: note.aiMetadata
          ? {
              ...note.aiMetadata,
              actionItems: normalizeActionItems(note.aiMetadata.actionItems || note.aiMetadata.action_items || []),
            }
          : note.aiMetadata,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        shareId: note.shareId,
      },
    });
  } catch (error) {
    console.error('Get public note error:', error);
    return res.status(500).json({ message: 'Failed to retrieve shared note' });
  }
};

/**
 * Make a note public or private
 * PATCH /shared/:id/visibility
 * 
 * Authenticated endpoint - user must own the note
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user's ID
 * @param {string} req.params.id - Note ID
 * @param {Object} req.body - Request body
 * @param {boolean} req.body.isPublic - Whether note should be public
 * @param {Object} res - Express response object
 * @returns {void}
 */
export const updateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body || {};
    const userId = req.user.id;

    // Validate inputs
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ message: 'Valid note ID is required' });
    }

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ message: 'isPublic must be a boolean' });
    }

    // Fetch note to verify ownership
    const note = await noteModel.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this note' });
    }

    // Update visibility
    const updatedNote = await noteModel.findByIdAndUpdate(
      id,
      { isPublic },
      { new: true }
    );

    return res.status(200).json({
      message: `Note is now ${isPublic ? 'public' : 'private'}`,
      shareId: isPublic ? updatedNote.shareId : null,
      note: updatedNote,
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    return res.status(500).json({ message: 'Failed to update note visibility' });
  }
};
