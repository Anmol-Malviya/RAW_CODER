import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'shortlisted', 'rejected'], default: 'pending' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
  resumeDetails: { type: String }, // Optional field for resume/details
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('InterviewCandidate', candidateSchema);
