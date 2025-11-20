import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'ionela@gmail.com';
    const newPassword = '123456'; // Very simple password

    const user = await User.findOne({ email });

    if (user) {
      console.log('\nResetting password for:', email);
      console.log('New password will be:', newPassword);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      console.log('Generated hash:', hashedPassword);
      console.log('Hash length:', hashedPassword.length);
      
      // Verify immediately
      const testMatch = await bcrypt.compare(newPassword, hashedPassword);
      console.log('Immediate test - password matches hash?', testMatch);
      
      user.password = hashedPassword;
      await user.save();
      
      // Read it back
      const savedUser = await User.findOne({ email });
      console.log('\nSaved hash:', savedUser.password);
      console.log('Saved hash length:', savedUser.password.length);
      
      const finalTest = await bcrypt.compare(newPassword, savedUser.password);
      console.log('Final test - password matches saved hash?', finalTest);
      
      console.log('\n✅ Password reset successfully!');
      console.log('\nYou can now login with:');
      console.log('Email: ionela@gmail.com');
      console.log('Password: 123456');
    } else {
      console.log('User not found with email:', email);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPassword();
