const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    tags: [{ type: String }],
    isPublic: { type: Boolean, default: false },
    shareId: { type: String, unique: true }, // For the public share page
    aiMetadata: {
      summary: String,
      actionItems: [String],
      suggestedTitle: String,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
); // Automatically handles updated_at [cite: 66]

const noteModel = mongoose.model("note", noteSchema);

export default noteModel;
