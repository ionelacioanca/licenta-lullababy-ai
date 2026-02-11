import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GrowthNotification from './models/GrowthNotification.js';
import Baby from './models/Baby.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const createNextNotification = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    const marcelId = '698c4f4ccdb5b46d7dbea206';
    const parentId = '69258e3786bdce50e37598f1';

    const marcel = await Baby.findById(marcelId);
    if (!marcel) {
      console.log('❌ Marcel not found!');
      return;
    }

    console.log('👶 Marcel:', {
      id: marcel._id,
      name: marcel.name,
      birthDate: marcel.birthDate,
      parentId: marcel.parentId
    });

    // Calculate next notification date (2 months - Marcel is 1 month old, so next is at 2 months)
    const birthDate = new Date(marcel.birthDate);
    const nextDate = new Date(birthDate);
    nextDate.setMonth(birthDate.getMonth() + 2); // 2 months old
    nextDate.setHours(10, 0, 0, 0); // 10:00 AM

    console.log('\n📅 Creating notification for 2 months old...');
    console.log('Scheduled date:', nextDate);

    // Check if notification already exists
    const existing = await GrowthNotification.findOne({
      babyId: marcelId,
      ageInMonths: 2,
      status: { $in: ['pending', 'sent'] }
    });

    if (existing) {
      console.log('⚠️ Notification for 2 months already exists:', existing);
      console.log('Status:', existing.status);
      console.log('Scheduled for:', existing.scheduledDate);
      return;
    }

    // Create new notification
    const notification = new GrowthNotification({
      babyId: marcelId,
      userId: parentId,
      scheduledDate: nextDate,
      status: 'sent', // Set to 'sent' so it appears immediately
      read: false,
      ageInMonths: 2,
      title: 'Time to measure Marcel! 📏',
      body: 'Marcel is 2 months old. Remember to record weight and length measurements.',
      type: 'growth_measurement'
    });

    await notification.save();
    console.log('✅ Created notification:', {
      id: notification._id,
      scheduledDate: notification.scheduledDate,
      status: notification.status,
      ageInMonths: notification.ageInMonths,
      read: notification.read
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

createNextNotification();
