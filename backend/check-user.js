import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'ionela@gmail.com';
    const user = await User.findOne({ email });

    if (user) {
      console.log('\nUser found:');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Password hash:', user.password);
      console.log('Reset code:', user.resetCode);
      console.log('Reset code expiry:', user.resetCodeExpiry);
      console.log('\nPassword hash starts with $2b$ (bcrypt)?', user.password.startsWith('$2b$'));
    } else {
      console.log('User not found with email:', email);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();
