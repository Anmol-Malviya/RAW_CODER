import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
  console.log('🔄 Checking Cloudinary Configuration...');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY);
  
  try {
    // We will create a tiny dummy file to simulate an upload
    fs.writeFileSync('dummy_test.txt', 'This is a test file for VyorAI integration');
    
    console.log('⏳ Uploading test file to Cloudinary...');
    const result = await cloudinary.uploader.upload('dummy_test.txt', {
      resource_type: 'raw',
      folder: 'vyorai_test',
    });
    
    console.log('✅ Upload Successful!');
    console.log('🌐 Secure URL:', result.secure_url);
    console.log('🎬 Format:', result.format);
    console.log('bytes:', result.bytes);

    // Clean up
    fs.unlinkSync('dummy_test.txt');
    console.log('🎉 Test passed! Cloudinary is working perfectly with your credentials.');
  } catch (error) {
    console.error('❌ Cloudinary Upload Failed:', error.message || error);
    if (fs.existsSync('dummy_test.txt')) fs.unlinkSync('dummy_test.txt');
  }
}

testCloudinary();
