import Job from '../models/Job.js';
import Session from '../models/Session.js';

// Get all sessions
export const getSessions = async (req, res) => {
  try {
    const sessions = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};


// Get candidates of a session
export const getSessionCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const dbSessions = await Session.find({ jobId: id }).populate('candidateId', 'name email').sort({ createdAt: -1 });
    // Transform to match what frontend expects
    const candidates = dbSessions.map(s => ({
      _id: s._id,
      name: s.candidateId ? s.candidateId.name : 'Unknown',
      email: s.candidateId ? s.candidateId.email : 'No email',
      resumeDetails: 'View details',
      status: s.status,
      sessionId: s.jobId
    }));
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};


// Update candidate status
export const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const candidate = await Session.findByIdAndUpdate(id, { status }, { new: true });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({
      _id: candidate._id,
      status: candidate.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update candidate status' });
  }
};

// Send shortlisted emails
export const sendShortlistedEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const candidates = await Session.find({ jobId: id, status: 'shortlisted' }).populate('candidateId');
    if (candidates.length === 0) {
      return res.status(400).json({ message: 'No shortlisted candidates found in this session.' });
    }
    
    // Simulating email send
    console.log(`Sending shortlisted emails to ${candidates.length} candidates in session ${id}`);
    
    res.json({ message: `Successfully sent selection emails to ${candidates.length} candidates.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send emails' });
  }
};

// Send rejection emails
export const sendRejectionEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const candidates = await Session.find({ jobId: id, status: 'rejected' }).populate('candidateId');
    if (candidates.length === 0) {
      return res.status(400).json({ message: 'No rejected candidates found in this session.' });
    }
    
    // Simulating email send
    console.log(`Sending rejection emails to ${candidates.length} candidates in session ${id}`);
    
    res.json({ message: `Successfully sent rejection emails to ${candidates.length} candidates.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send emails' });
  }
};
