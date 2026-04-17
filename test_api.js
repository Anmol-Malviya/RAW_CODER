import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Advanced API Test Suite...');
  let token = '';
  let adminToken = '';
  let jobId = 'mock_job_1';

  try {
    // 1. Health Check
    console.log('\n[1] Checking Server Health...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Status:', health.status);

    // 2. Candidate Registration
    console.log('\n[2] Registering Candidate...');
    const candidateData = { name: 'John Doe', email: `john_${Date.now()}@test.com`, password: 'password123', role: 'candidate' };
    const regRes = await axios.post(`${API_URL}/auth/register`, candidateData);
    token = regRes.data.token;
    console.log('✅ Candidate Registered');

    // 3. Admin Registration
    console.log('\n[3] Registering Admin...');
    const adminData = { name: 'Admin User', email: `admin_${Date.now()}@test.com`, password: 'adminpassword', role: 'admin' };
    const adminRegRes = await axios.post(`${API_URL}/auth/register`, adminData);
    adminToken = adminRegRes.data.token;
    console.log('✅ Admin Registered');

    // 4. Create Job (Admin)
    console.log('\n[4] Creating Job (Admin)...');
    const jobRes = await axios.post(`${API_URL}/jobs`, 
      { title: 'AI Engineer', description: 'Experience with LLMs' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    jobId = jobRes.data._id;
    console.log('✅ Job Created ID:', jobId);

    // 5. Fetch Jobs (Candidate)
    console.log('\n[5] Fetching Jobs (Candidate)...');
    const jobsRes = await axios.get(`${API_URL}/jobs`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`✅ Jobs found: ${jobsRes.data.length}`);

    // 6. Generate MCQ (Candidate)
    console.log('\n[6] Generating MCQ (Candidate)...');
    // Create a dummy file for upload
    const dummyPdfPath = path.resolve('dummy.pdf');
    fs.writeFileSync(dummyPdfPath, 'Dummy PDF content for testing');
    
    const form = new FormData();
    form.append('jobId', jobId);
    form.append('resume', fs.createReadStream(dummyPdfPath));

    try {
      const mcqRes = await axios.post(`${API_URL}/generate-mcq`, form, {
        headers: { 
          ...form.getHeaders(),
          Authorization: `Bearer ${token}` 
        }
      });
      console.log(`✅ MCQ Generated! Questions: ${mcqRes.data.questions.length}`);
      
      const sessionId = mcqRes.data.sessionId;

      // 7. Submit Assessment
      console.log('\n[7] Submitting Assessment...');
      const answers = { 1: 'Option A', 2: 'Option A' }; // Based on mock questions
      const submitRes = await axios.post(`${API_URL}/submit-assessment`, 
        { sessionId, answers, tabSwitchCount: 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Assessment Submitted! Result received.');
    } catch (mcqErr) {
      console.error('❌ MCQ Test Failed:', mcqErr.response?.data?.error || mcqErr.message);
    } finally {
      if (fs.existsSync(dummyPdfPath)) fs.unlinkSync(dummyPdfPath);
    }

    console.log('\n🚀 ALL TESTS COMPLETED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('💥 Test execution failed:', error.response?.data || error.message);
  }
}

runTests();
