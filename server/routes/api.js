import { Router } from 'express';
import upload from '../middleware/upload.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { createJob, getJobs, getJobDetails, getJobCandidates, getJobByCode } from '../controllers/jobController.js';
import { generateMCQ, submitAssessment, getSession, uploadRecording, uploadScreenRecording, getUserSessions, generatePracticeSession } from '../controllers/mcqController.js';
import { voiceChat } from '../controllers/voiceController.js';
import { chatWithBot } from '../controllers/chatController.js';

const router = Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', requireAuth, getProfile);
router.put('/auth/profile', requireAuth, updateProfile);

// Job Routes
router.get('/jobs', requireAuth, getJobs);
router.post('/jobs', requireAuth, requireAdmin, createJob);
router.get('/jobs/code/:code', requireAuth, getJobByCode);
router.get('/jobs/:id', requireAuth, getJobDetails);
router.get('/jobs/:id/candidates', requireAuth, requireAdmin, getJobCandidates);

// MCQ Routes
router.post('/generate-mcq', requireAuth, upload.single('resume'), generateMCQ);
router.post('/generate-practice', requireAuth, upload.single('resume'), generatePracticeSession);
router.post('/submit-assessment', requireAuth, submitAssessment);
router.post('/upload-recording', requireAuth, upload.single('video'), uploadRecording);
router.post('/upload-screen', requireAuth, upload.single('video'), uploadScreenRecording);
router.get('/session/:id', requireAuth, getSession);
router.get('/sessions/user', requireAuth, getUserSessions);

// Voice Routes
router.post('/voice-chat', requireAuth, voiceChat);

// Bot Routes
router.post('/chat', chatWithBot);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
