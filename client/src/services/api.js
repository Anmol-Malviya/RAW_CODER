import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://raw-coder-backend.onrender.com/api';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120000, // 2 min timeout for AI generation
});

export const registerUser = async (name, email, password, role) => {
  const response = await api.post('/auth/register', { name, email, password, role });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

// Job endpoints
export const fetchJobs = async () => {
  const response = await api.get('/jobs');
  return response.data;
};

export const createJob = async (title, description, difficulty, interviewType, hasCodingRound) => {
  const response = await api.post('/jobs', { title, description, difficulty, interviewType, hasCodingRound });
  return response.data;
};

export const updateJobStatus = async (jobId, isActive) => {
  const response = await api.put(`/jobs/${jobId}/status`, { isActive });
  return response.data;
};

export const validateInterviewCode = async (code) => {
  const response = await api.get(`/jobs/code/${code}`);
  return response.data;
};

export const getJobCandidates = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/candidates`);
  return response.data;
};

export const generateMCQ = async (file, jobId) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('jobId', jobId);

  const response = await api.post('/generate-mcq', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const generatePracticeSession = async (file, targetRole, topic) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('targetRole', targetRole);
  if (topic) formData.append('topic', topic);

  const response = await api.post('/generate-practice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const submitAssessment = async (sessionId, answers, tabSwitchCount, testDurationSeconds) => {
  const response = await api.post('/submit-assessment', {
    sessionId,
    answers,
    tabSwitchCount,
    testDurationSeconds
  });
  return response.data;
};

export const voiceChat = async (transcript, jobRole, resumeSnippet, history) => {
  const response = await api.post('/voice-chat', {
    transcript,
    jobRole,
    resumeSnippet,
    history,
  });
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/session/${sessionId}`);
  return response.data;
};

export const getUserSessions = async () => {
  const response = await api.get('/sessions/user');
  return response.data;
};

export const fetchAllSessions = async () => {
  const response = await api.get('/sessions/all');
  return response.data;
};

export const uploadRecording = async (sessionId, videoBlob) => {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('video', videoBlob, 'interview_recording.webm');

  const response = await api.post('/upload-recording', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadScreenRecording = async (sessionId, videoBlob) => {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('video', videoBlob, 'screen_recording.webm');

  const response = await api.post('/upload-screen', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchQuestions = async () => {
  const response = await api.get('/questions');
  return response.data;
};

export const addQuestion = async (questionData) => {
  const response = await api.post('/questions', questionData);
  return response.data;
};

export const deleteQuestion = async (id) => {
  const response = await api.delete(`/questions/${id}`);
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

export const fetchSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSetting = async (key, value) => {
  const response = await api.post('/settings', { key, value });
  return response.data;
};

export default api;
