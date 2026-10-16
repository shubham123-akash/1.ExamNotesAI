import mongoose from "mongoose";
const notesSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true
    },

    topic: {
      type: String,
      required: true
    },

    classLevel: String,
    examType: String,

    language: {
      type: String,
      default: "English"
    },

    isFavorite: {
      type: Boolean,
      default: false
    },

    tags: {
      type: [String],
      default: []
    },

    // public sharing (shareId only works while isPublic is true)
    shareId: {
      type: String,
      unique: true,
      sparse: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },

    // quiz history (last 20 attempts are kept)
    quizScores: [{
      score: Number,
      total: Number,
      takenAt: { type: Date, default: Date.now }
    }],

    revisionMode: {
      type: Boolean,
      default: false
    },

    includeDiagram: Boolean,
    includeChart: Boolean,

    content: {
      type: mongoose.Schema.Types.Mixed, // AI response (string / JSON)
      required: true
    }

},{timestamps:true})

const Notes = mongoose.model("Notes" , notesSchema)

export default Notes