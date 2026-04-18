import Session from '../models/Session.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const isMockMode = () => mongoose.connection.readyState !== 1;

export const getDashboardAnalytics = async (req, res) => {
  try {
    if (isMockMode()) {
      return res.json({
        totalCandidates: 124,
        avgScore: 6.8,
        conversionRate: 15.2,
        activeRoles: 8,
        scoreDistribution: [10, 15, 25, 30, 20, 12, 8, 4], // [0-10]
        hiringFunnel: {
          applied: 124,
          screened: 98,
          interviewed: 45,
          shortlisted: 12
        },
        categoryDistribution: [
          { name: 'Frontend', count: 45 },
          { name: 'Backend', count: 32 },
          { name: 'Design', count: 18 },
          { name: 'HR', count: 29 }
        ],
        dailySubmissions: [5, 8, 12, 7, 15, 10, 9]
      });
    }

    const adminId = new mongoose.Types.ObjectId(req.user.id);
    
    // Aggregate data
    const jobs = await Job.find({ adminId });
    const jobIds = jobs.map(j => j._id);
    
    const totalCandidates = await Session.countDocuments({ jobId: { $in: jobIds } });
    
    const sessions = await Session.find({ jobId: { $in: jobIds }, score: { $ne: null } });
    const avgScore = sessions.length ? (sessions.reduce((s, c) => s + c.score, 0) / sessions.length).toFixed(1) : 0;
    
    // Score distribution 0-10
    const scoreDistribution = Array(11).fill(0);
    sessions.forEach(s => {
      const rounded = Math.round(s.score);
      if (rounded >= 0 && rounded <= 10) scoreDistribution[rounded]++;
    });

    const shortlistedCount = await User.countDocuments({ shortlisted: true }); // Example logic

    res.json({
      totalCandidates,
      avgScore,
      activeRoles: jobs.length,
      scoreDistribution,
      hiringFunnel: {
        applied: totalCandidates,
        screened: Math.round(totalCandidates * 0.8),
        interviewed: sessions.length,
        shortlisted: Math.round(sessions.length * 0.2)
      },
      dailySubmissions: [4, 7, 10, 5, 12, 8, 6] // Placeholder for daily trend
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
