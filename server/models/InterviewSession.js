import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('InterviewSession', interviewSessionSchema);
