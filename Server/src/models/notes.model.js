import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    category: { type: String, default: 'Personal' },
    tags: [{ type: String }],
    collaborators: [
      {
        email: { type: String, required: true },
        role: {
          type: String,
          enum: ['editor', 'viewer'],
          default: 'editor',
        },
      },
    ],
    isPublic: { type: Boolean, default: false },
    shareId: { type: String, unique: true }, // For the public share page
    aiMetadata: {
      summary: String,
      actionItems: [
        {
          text: { type: String, required: true },
          isCompleted: { type: Boolean, default: false },
        },
      ],
      suggestedTitle: String,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
); // Automatically handles updated_at [cite: 66]

const noteModel = mongoose.model("note", noteSchema);

export default noteModel;
