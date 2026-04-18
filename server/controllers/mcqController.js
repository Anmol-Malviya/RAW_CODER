import { Groq } from 'groq-sdk';
import extractTextFromPDF from '../utils/pdfParser.js';
import Session from '../models/Session.js';
import Job from '../models/Job.js';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'default-key',
});

const isMockMode = () => mongoose.connection.readyState !== 1;
import mongoose from 'mongoose';

const SAMPLE_QUESTIONS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  question: `Mock technical question ${i + 1}?`,
  options: ["Option A", "Option B", "Option C", "Option D"],
  correctAnswer: "Option A",
  explanation: `Explanation for mock question ${i + 1}.`
}));

const MCQ_SYSTEM_PROMPT = `You are an expert technical interviewer. The input provided contains a candidate's parsed Resume Text and a Target Job Role. Generate exactly 10 Multiple Choice Questions to test the candidate's suitability for this specific role. The questions must heavily test the frameworks, languages, and concepts mentioned in the resume. Return the output as a valid JSON object containing an array called 'questions'. Each question must contain: 'id' (integer), 'question' (string), 'options' (array of 4 strings), 'correctAnswer' (string exactly matching one option), and 'explanation' (string explaining the correct choice). Return ONLY the JSON object, no markdown formatting or code blocks.`;

export const generateMCQ = async (req, res) => {
  try {
    const { jobId } = req.body;
    const pdfFile = req.file;

    if (!pdfFile) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const jobRole = job.title;
    const jobDescription = job.description;

    // Extract text from PDF
    const resumeText = await extractTextFromPDF(pdfFile.buffer);

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text from resume' });
    }

    // Generate MCQs with Groq
    let questions;
    try {
      if (process.env.GROQ_API_KEY === 'default-key' || !process.env.GROQ_API_KEY) {
        throw new Error('No API Key');
      }
      const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: MCQ_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Resume Text:\n${resumeText}\n\nTarget Job Role: ${jobRole}\n\nJob Description Requirements: ${jobDescription}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
        response_format: { type: 'json_object' }
      });

      const responseContent = completion.choices[0].message.content;
      const parsedQuestions = JSON.parse(responseContent);
      questions = parsedQuestions.questions;
    } catch (err) {
      console.warn('⚡ Mock Mode: Using sample questions (Groq failed or missing)');
      questions = SAMPLE_QUESTIONS;
    }

    if (!Array.isArray(questions) || questions.length !== 10) {
      return res.status(500).json({ error: 'AI did not generate exactly 10 questions' });
    }

    // Save session to database
    let sessionId;
    try {
      const session = new Session({
        candidateId: req.user.id,
        jobId: job._id,
        jobRole,
        resumeText,
        questions,
        sessionType: 'live',
      });
      await session.save();
      sessionId = session._id;
    } catch (dbError) {
      // DB might not be connected — generate a temporary ID
      console.warn('DB save failed, using temporary session:', dbError.message);
      sessionId = `temp_${Date.now()}`;
    }

    res.json({
      sessionId,
      questions: questions.map(({ id, question, options }) => ({
        id,
        question,
        options,
      })),
      _rawQuestions: questions, // Full data for client-side scoring fallback
    });
  } catch (error) {
    console.error('MCQ Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate questions' });
  }
};

// ─── Practice Session (Candidate Self-Created) ─── //
export const generatePracticeSession = async (req, res) => {
  try {
    const { targetRole, topic } = req.body;
    const pdfFile = req.file;

    if (!pdfFile) return res.status(400).json({ error: 'No PDF resume uploaded' });
    if (!targetRole) return res.status(400).json({ error: 'Target role is required' });

    const resumeText = await extractTextFromPDF(pdfFile.buffer);
    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text from resume' });
    }

    const practiceJobRole = targetRole;
    const practiceContext = topic ? `Topic focus: ${topic}` : '';

    let questions;
    try {
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'default-key') throw new Error('No API Key');
      const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: MCQ_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Resume Text:\n${resumeText}\n\nTarget Job Role: ${practiceJobRole}\n\n${practiceContext}\n\nThis is a self-directed practice session. Generate relevant interview questions.`,
          },
        ],
        temperature: 0.75,
        max_tokens: 4000,
        stream: false,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      questions = parsed.questions;
    } catch (err) {
      console.warn('Practice: Using sample questions (Groq unavailable)');
      questions = SAMPLE_QUESTIONS;
    }

    if (!Array.isArray(questions) || questions.length !== 10) {
      return res.status(500).json({ error: 'Failed to generate 10 practice questions' });
    }

    let sessionId;
    try {
      const session = new Session({
        candidateId: req.user.id,
        jobId: null,
        jobRole: practiceJobRole,
        resumeText,
        questions,
        sessionType: 'practice',
      });
      await session.save();
      sessionId = session._id;
    } catch (dbErr) {
      console.warn('Practice DB save failed:', dbErr.message);
      sessionId = `temp_practice_${Date.now()}`;
    }

    res.json({
      sessionId,
      jobRole: practiceJobRole,
      questions: questions.map(({ id, question, options }) => ({ id, question, options })),
      _rawQuestions: questions,
    });
  } catch (error) {
    console.error('Practice Session Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create practice session' });
  }
};

export const submitAssessment = async (req, res) => {
  try {
    const { sessionId, answers, tabSwitchCount, warnings } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ error: 'Session ID and answers are required' });
    }

    // Try to get session from DB
    let session;
    try {
      session = await Session.findById(sessionId);
    } catch {
      // Session might be a temp session
    }

    if (session) {
      // Calculate score
      let score = 0;
      session.questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) {
          score++;
        }
      });

      session.answers = answers;
      session.score = score;
      session.tabSwitchCount = tabSwitchCount || 0;
      session.warnings = warnings || 0;
      session.completedAt = new Date();
      session.testDurationSeconds = req.body.testDurationSeconds || 0;
      await session.save();

      return res.json({
        score,
        totalQuestions: session.questions.length,
        tabSwitchCount: session.tabSwitchCount,
        questions: session.questions,
        answers,
      });
    }

    // Fallback for temp sessions — score on client side
    res.json({
      message: 'Session not found in DB — score calculated on client',
      answers,
      tabSwitchCount: tabSwitchCount || 0,
    });
  } catch (error) {
    console.error('Submit Error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
};

export const getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ candidateId: req.user.id })
                                  .populate('jobId', 'title company')
                                  .sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Get User Sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
};

export const getAllAdminSessions = async (req, res) => {
  try {
    if (isMockMode()) {
       const mock = [
         { _id: 's1', candidateId: { name: 'Mock User' }, jobRole: 'Frontend Dev', score: 8, createdAt: new Date(), sessionType: 'live' }
       ];
       return res.json(mock);
    }
    const sessions = await Session.find({})
                                  .populate('candidateId', 'name email')
                                  .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
};

export const uploadRecording = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
    
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'video', folder: 'vyorai_interviews' }, async (error, result) => {
      if (error) return res.status(500).json({ error: 'Cloudinary upload failed' });
      
      await Session.findByIdAndUpdate(sessionId, { videoUrl: result.secure_url });
      res.json({ message: 'Upload successful', videoUrl: result.secure_url });
    });
    
    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload recording' });
  }
};

export const uploadScreenRecording = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
    
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'video', folder: 'vyorai_interviews' }, async (error, result) => {
      if (error) return res.status(500).json({ error: 'Cloudinary upload failed' });
      
      await Session.findByIdAndUpdate(sessionId, { screenUrl: result.secure_url });
      res.json({ message: 'Screen upload successful', screenUrl: result.secure_url });
    });
    
    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Screen Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload screen recording' });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;
    if (!sessionId || !rating) {
      return res.status(400).json({ error: 'Session ID and rating are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await session.save();
    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback Submission Error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

export const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!['pending', 'shortlisted', 'rejected', 'deleted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { status },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Status updated', status: session.status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};
