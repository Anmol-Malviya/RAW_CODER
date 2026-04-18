import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = 'mongodb://rawcoder:anmol4328@ac-t3jkgbp-shard-00-00.lfdythx.mongodb.net:27017,ac-t3jkgbp-shard-00-01.lfdythx.mongodb.net:27017,ac-t3jkgbp-shard-00-02.lfdythx.mongodb.net:27017/vyorai?ssl=true&replicaSet=atlas-a1014j-shard-0&authSource=admin';

const userSchema = new mongoose.Schema({ name: String, email: String, role: String }, { strict: false });
const User = mongoose.model('User', userSchema);

const jobSchema = new mongoose.Schema({ title: String, adminId: mongoose.Schema.Types.ObjectId, interviewCode: String }, { strict: false });
const Job = mongoose.model('Job', jobSchema);

const sessionSchema = new mongoose.Schema({}, { strict: false });
const Session = mongoose.model('Session', sessionSchema);

async function seedData() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    // 1. Get the admin user
    const adminUser = await User.findOne({ email: 'admin@vyor.ai' });
    if (!adminUser) {
      console.error('❌ Could not find admin@vyor.ai. Cannot proceed.');
      process.exit(1);
    }
    console.log(`✅ Found Admin: ${adminUser._id}`);

    // 2. Create mock Jobs
    const job1 = await Job.create({
      title: 'Senior Frontend React Engineer',
      description: 'Expert in React, Redux, Node.js, and Modern Web architectures.',
      difficulty: 'advanced',
      interviewType: 'technical',
      hasCodingRound: true,
      interviewCode: 'RFT99X',
      adminId: adminUser._id,
      isActive: true,
      createdAt: new Date(),
    });

    const job2 = await Job.create({
      title: 'Backend Python Developer',
      description: 'Expert in Python, Django, REST APIs, and System Design.',
      difficulty: 'intermediate',
      interviewType: 'technical',
      hasCodingRound: false,
      interviewCode: 'PYDEV1',
      adminId: adminUser._id,
      isActive: true,
      createdAt: new Date(),
    });
    console.log(`✅ Created 2 Open Roles.`);

    // 3. Create mock Candidates
    const c1 = await User.create({ name: 'Rahul Sharma', email: 'rahul.s@example.com', role: 'candidate', password: 'mockpassword' });
    const c2 = await User.create({ name: 'Priya Patel', email: 'priya.tech@example.com', role: 'candidate', password: 'mockpassword' });
    const c3 = await User.create({ name: 'Amit Kumar', email: 'amit.kumar@example.com', role: 'candidate', password: 'mockpassword' });
    console.log(`✅ Created 3 Candidates.`);

    // 4. Create mock Sessions (Assessments)
    const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      question: `This is a sample technical question ${i + 1}?`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Explanation for A'
    }));

    // Candidate 1: Finished strong on Job 1
    await Session.create({
      candidateId: c1._id,
      jobId: job1._id,
      jobRole: job1.title,
      resumeText: 'Rahul Sharma Mock Resume with React skills',
      questions: mockQuestions,
      answers: { '1': 'A', '2': 'A', '3': 'A', '4': 'A', '5': 'B', '6': 'A', '7': 'A', '8': 'A', '9': 'A', '10': 'A' },
      score: 9,
      tabSwitchCount: 0,
      testDurationSeconds: 420, // 7 mins
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(Date.now() - 3000000),
    });

    // Candidate 2: Finished average on Job 1 with tab switches
    await Session.create({
      candidateId: c2._id,
      jobId: job1._id,
      jobRole: job1.title,
      resumeText: 'Priya Patel React Developer',
      questions: mockQuestions,
      answers: { '1': 'A', '2': 'B', '3': 'A', '4': 'B', '5': 'A', '6': 'C', '7': 'D', '8': 'A', '9': 'B', '10': 'A' },
      score: 5,
      tabSwitchCount: 3, // Flagged
      testDurationSeconds: 615,
      createdAt: new Date(Date.now() - 7200000),
      completedAt: new Date(Date.now() - 6500000),
    });

    // Candidate 3: Failed on Job 2
    await Session.create({
      candidateId: c3._id,
      jobId: job2._id,
      jobRole: job2.title,
      resumeText: 'Amit Kumar Python Developer',
      questions: mockQuestions,
      answers: { '1': 'B', '2': 'B', '3': 'C', '4': 'D', '5': 'C', '6': 'B', '7': 'C', '8': 'D', '9': 'B', '10': 'A' },
      score: 1,
      tabSwitchCount: 0,
      testDurationSeconds: 230,
      createdAt: new Date(),
      completedAt: new Date(),
    });
    console.log(`✅ Created 3 Detailed Sessions.`);

    console.log('🎉 Data successfully seeded into the Admin Dashboard!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedData();
