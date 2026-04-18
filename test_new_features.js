/**
 * VyorAI New Features Validation Script
 * Tests: Job Code Generation, Validation, and Coding Toggle
 */
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let candidateToken = '';
let testJobCode = '';

async function setup() {
    console.log('--- Setting up test users ---');
    try {
        const admin = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Admin',
            email: `admin_${Date.now()}@test.com`,
            password: 'password123',
            role: 'admin'
        });
        adminToken = admin.data.token;
        console.log('✅ Admin account created');

        const candidate = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Candidate',
            email: `cand_${Date.now()}@test.com`,
            password: 'password123',
            role: 'candidate'
        });
        candidateToken = candidate.data.token;
        console.log('✅ Candidate account created');
    } catch (e) {
        console.error('❌ Setup failed:', e.message);
    }
}

async function testJobCreation() {
    console.log('\n--- Testing Advanced Job Creation ---');
    try {
        const response = await axios.post(`${BASE_URL}/jobs`, {
            title: 'Full Stack Developer',
            description: 'Require React and Node experts',
            difficulty: 'intermediate',
            interviewType: 'technical',
            hasCodingRound: true
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        if (response.data.interviewCode) {
            testJobCode = response.data.interviewCode;
            console.log('✅ Success: Job created with unique code:', testJobCode);
            console.log('✅ Details:', {
                difficulty: response.data.difficulty,
                type: response.data.interviewType,
                coding: response.data.hasCodingRound
            });
        } else {
            console.error('❌ Failed: Code not generated');
        }
    } catch (e) {
        console.error('❌ ERROR:', e.response?.data || e.message);
    }
}

async function testCodeValidation() {
    console.log('\n--- Testing Interview Code Validation ---');
    try {
        const response = await axios.get(`${BASE_URL}/jobs/code/${testJobCode}`, {
            headers: { Authorization: `Bearer ${candidateToken}` }
        });

        if (response.data.title === 'Full Stack Developer') {
            console.log('✅ Success: Code validated and job details returned');
        } else {
            console.error('❌ Failed: Incorrect job data returned');
        }
    } catch (e) {
        console.error('❌ ERROR:', e.response?.data || e.message);
    }
}

async function run() {
    await setup();
    await testJobCreation();
    await testCodeValidation();
    console.log('\n--- All New Feature Backend Tests Completed ---');
}

run();
