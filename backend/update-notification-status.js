import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GrowthNotification from './models/GrowthNotification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const updateNotificationStatus = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    const notificationId = '698c571a256575e7b1dd978d';

    console.log('📊 Updating notification status from pending to sent...');
    
    const notification = await GrowthNotification.findById(notificationId);
    if (!notification) {
      console.log('❌ Notification not found!');
      return;
    }

    console.log('Before:', {
      id: notification._id,
      status: notification.status,
      scheduledDate: notification.scheduledDate,
      read: notification.read,
      ageInMonths: notification.ageInMonths
    });

    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();

    console.log('\n✅ Updated!');
    console.log('After:', {
      id: notification._id,
      status: notification.status,
      scheduledDate: notification.scheduledDate,
      sentAt: notification.sentAt,
      read: notification.read,
      ageInMonths: notification.ageInMonths
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

updateNotificationStatus();
