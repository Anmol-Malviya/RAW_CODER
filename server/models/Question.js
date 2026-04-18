import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, required: true, default: 'General' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  type: { type: String, enum: ['mcq', 'voice'], default: 'mcq' },
  options: [String], // for MCQ
  correctAnswer: String, // for MCQ
  explanation: String,
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const Question = mongoose.model('Question', questionBankSchema);
export default Question;
