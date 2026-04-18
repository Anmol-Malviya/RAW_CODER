import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = 'mongodb://rawcoder:anmol4328@ac-t3jkgbp-shard-00-00.lfdythx.mongodb.net:27017,ac-t3jkgbp-shard-00-01.lfdythx.mongodb.net:27017,ac-t3jkgbp-shard-00-02.lfdythx.mongodb.net:27017/vyorai?ssl=true&replicaSet=atlas-a1014j-shard-0&authSource=admin';

const sessionSchema = new mongoose.Schema({}, { strict: false });
const Session = mongoose.model('Session', sessionSchema);

async function injectVideo() {
  try {
    await mongoose.connect(MONGO_URI);
    // Use a demo video URL from Cloudinary specifically for interviews
    await Session.updateMany({}, { $set: { screenUrl: 'https://res.cloudinary.com/demo/video/upload/v1689163273/docs/coding_interview.mp4' } });
    console.log('✅ Demo Video URL inserted successfully. Admin panel will now show it!');
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

injectVideo();
