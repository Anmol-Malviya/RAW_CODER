import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = 'mongodb://rawcoder:anmol4328@ac-t3jkgbp-shard-00-00.lfdythx.mongodb.net:27017,ac-t3jkgbp-shard-00-01.lfdythx.mongodb.net:27017,ac-t3jkgbp-shard-00-02.lfdythx.mongodb.net:27017/vyorai?ssl=true&replicaSet=atlas-a1014j-shard-0&authSource=admin';

const userSchema = new mongoose.Schema({ email: String }, { strict: false });
const User = mongoose.model('User', userSchema);

const jobSchema = new mongoose.Schema({}, { strict: false });
const Job = mongoose.model('Job', jobSchema);

const sessionSchema = new mongoose.Schema({}, { strict: false });
const Session = mongoose.model('Session', sessionSchema);

async function cleanDB() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    console.log('🗑️ Deleting all Jobs...');
    const jobsRes = await Job.deleteMany({});
    console.log(`✅ Deleted ${jobsRes.deletedCount} Jobs.`);

    console.log('🗑️ Deleting all Candidates/Sessions...');
    const sessRes = await Session.deleteMany({});
    console.log(`✅ Deleted ${sessRes.deletedCount} Sessions.`);

    console.log('🗑️ Deleting all Users except admin@vyor.ai...');
    const userRes = await User.deleteMany({ email: { $ne: 'admin@vyor.ai' } });
    console.log(`✅ Deleted ${userRes.deletedCount} Users.`);

    console.log('🎉 Database cleanup complete!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanDB();
