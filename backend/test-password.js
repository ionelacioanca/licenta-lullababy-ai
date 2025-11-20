import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function testPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'ionela@gmail.com';
    const testPassword = process.argv[2] || 'test123'; // Get password from command line

    const user = await User.findOne({ email });

    if (user) {
      console.log('\nTesting password:', testPassword);
      console.log('Against hash:', user.password);
      
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('\nPassword match:', isMatch);
      
      if (!isMatch) {
        console.log('\n⚠️ Password does NOT match!');
        console.log('Try running: node test-password.js YOUR_PASSWORD');
      } else {
        console.log('\n✅ Password matches!');
      }
    } else {
      console.log('User not found with email:', email);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testPassword();
