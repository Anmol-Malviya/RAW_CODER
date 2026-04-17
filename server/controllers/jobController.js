import Job from '../models/Job.js';
import Session from '../models/Session.js';
import mongoose from 'mongoose';

const mockJobs = [
  { _id: 'mock_job_1', title: 'Senior Software Engineer', description: 'Expert in React and Node.js', adminId: 'mock_admin', isActive: true, createdAt: new Date() }
];
const isMockMode = () => mongoose.connection.readyState !== 1;

export const createJob = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (isMockMode()) {
      console.log('⚡ Mock Mode: Creating job in-memory');
      const job = { _id: `job_${Date.now()}`, title, description, adminId: req.user.id, isActive: true, createdAt: new Date() };
      mockJobs.push(job);
      return res.status(201).json(job);
    }

    const job = new Job({
      title,
      description,
      adminId: req.user.id,
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

export const getJobs = async (req, res) => {
  try {
    if (isMockMode()) {
      console.log('⚡ Mock Mode: Fetching jobs from memory');
      return res.json(mockJobs);
    }
    // If admin is requesting, return their jobs. Otherwise, return all active jobs for candidates.
    let filter = { isActive: true };
    if (req.user.role === 'admin') {
      filter = { adminId: req.user.id };
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Get Jobs Error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const getJobDetails = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

export const getJobCandidates = async (req, res) => {
  try {
    const jobId = req.params.id;
    // Admins only: get all sessions mapped to this job
    const sessions = await Session.find({ jobId }).populate('candidateId', 'name email').sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Get Job Candidates Error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};
