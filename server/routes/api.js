import { Router } from 'express';
import upload from '../middleware/upload.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { register, login } from '../controllers/authController.js';
import { createJob, getJobs, getJobDetails, getJobCandidates } from '../controllers/jobController.js';
import { generateMCQ, submitAssessment, getSession } from '../controllers/mcqController.js';
import { voiceChat } from '../controllers/voiceController.js';

const router = Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Job Routes
router.get('/jobs', requireAuth, getJobs);
router.post('/jobs', requireAuth, requireAdmin, createJob);
router.get('/jobs/:id', requireAuth, getJobDetails);
router.get('/jobs/:id/candidates', requireAuth, requireAdmin, getJobCandidates);

// MCQ Routes
router.post('/generate-mcq', requireAuth, upload.single('resume'), generateMCQ);
router.post('/submit-assessment', requireAuth, submitAssessment);
router.get('/session/:id', requireAuth, getSession);

// Voice Routes
router.post('/voice-chat', requireAuth, voiceChat);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
