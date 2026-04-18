import Question from '../models/Question.js';
import mongoose from 'mongoose';

const isMockMode = () => mongoose.connection.readyState !== 1;

let mockQuestions = [
  { _id: 'q1', text: 'What is React?', category: 'Frontend', difficulty: 'beginner', type: 'mcq', options: ['Library', 'Framework', 'Language'], correctAnswer: 'Library', adminId: 'mock' },
  { _id: 'q2', text: 'Explain Closures in JS', category: 'Backend', difficulty: 'intermediate', type: 'voice', adminId: 'mock' }
];

export const getQuestions = async (req, res) => {
  try {
    if (isMockMode()) return res.json(mockQuestions);
    const questions = await Question.find({ adminId: req.user.id }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { text, category, difficulty, type, options, correctAnswer, explanation } = req.body;
    if (isMockMode()) {
      const q = { _id: Date.now().toString(), ...req.body, adminId: req.user.id, createdAt: new Date() };
      mockQuestions.push(q);
      return res.status(201).json(q);
    }
    const question = new Question({
      text, category, difficulty, type, options, correctAnswer, explanation,
      adminId: req.user.id
    });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create question' });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    if (isMockMode()) {
      mockQuestions = mockQuestions.filter(q => q._id !== req.params.id);
      return res.json({ message: 'Deleted' });
    }
    await Question.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
};
