import mongoose from 'mongoose';

/**
 * AI Usage Log Schema
 * Tracks API calls to AI services for analytics and billing
 */
const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
    },
    operation: {
      type: String,
      enum: ['generate-summary', 'generate-title', 'extract-actions'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for analytics queries
aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ userId: 1, operation: 1 });

const aiUsageModel = mongoose.model('aiUsage', aiUsageSchema);

export default aiUsageModel;
