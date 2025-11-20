import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const email = 'ionela@gmail.com';
    const password = 'password123';

    console.log('Testing login for:', email);
    console.log('With password:', password);
    console.log();

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ User found');
    console.log('Stored hash:', user.password);
    console.log('Hash length:', user.password.length);
    console.log();

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      console.log('✅ PASSWORD MATCHES! Login should work.');
      console.log('\nYou can login with:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH!');
      console.log('\nThe password in the database does not match "password123"');
      console.log('You may need to reset it again.');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
