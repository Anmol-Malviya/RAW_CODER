import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

// Job endpoints
export const fetchJobs = async () => {
  const response = await api.get('/jobs');
  return response.data;
};

export const createJob = async (title, description) => {
  const response = await api.post('/jobs', { title, description });
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

export default api;
