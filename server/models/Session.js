import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: Number,
  question: String,
  options: [String],
  correctAnswer: String,
  explanation: String,
});

const sessionSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  jobRole: { type: String }, // cached role name
  resumeText: { type: String, required: true },
  questions: [questionSchema],
  answers: {
    type: Map,
    of: String,
    default: {},
  },
  score: { type: Number, default: null },
  tabSwitchCount: { type: Number, default: 0 },
  warnings: { type: Number, default: 0 },
  voiceChatHistory: [
    {
      role: String,
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  testDurationSeconds: { type: Number, default: 0 },
  videoUrl: { type: String, default: null },
  screenUrl: { type: String, default: null },
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
