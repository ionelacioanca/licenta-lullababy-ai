import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GrowthNotification from './models/GrowthNotification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const resetNotification = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    const marcelId = '698c4f4ccdb5b46d7dbea206';

    // Find the dismissed notification for Marcel
    const notification = await GrowthNotification.findOne({ 
      babyId: marcelId,
      status: 'dismissed'
    }).sort({ updatedAt: -1 }); // Get most recent

    if (!notification) {
      console.log('❌ No dismissed notification found for Marcel');
      console.log('\nSearching for any notification...');
      
      const anyNotif = await GrowthNotification.findOne({ babyId: marcelId })
        .sort({ updatedAt: -1 });
      
      if (anyNotif) {
        console.log('\nFound notification:', {
          id: anyNotif._id,
          status: anyNotif.status,
          ageInMonths: anyNotif.ageInMonths,
          read: anyNotif.read
        });
        
        console.log('\nResetting to sent...');
        anyNotif.status = 'sent';
        anyNotif.read = false;
        anyNotif.sentAt = new Date();
        await anyNotif.save();
        
        console.log('✅ Reset to sent!');
      } else {
        console.log('No notifications found at all for Marcel');
      }
      return;
    }

    console.log('📊 Found dismissed notification:', {
      id: notification._id,
      status: notification.status,
      ageInMonths: notification.ageInMonths,
      read: notification.read,
      scheduledDate: notification.scheduledDate
    });

    console.log('\n🔄 Resetting to sent status...');
    notification.status = 'sent';
    notification.read = false;
    notification.sentAt = new Date();
    await notification.save();

    console.log('✅ Notification reset!');
    console.log('New status:', {
      id: notification._id,
      status: notification.status,
      read: notification.read,
      sentAt: notification.sentAt
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

resetNotification();
