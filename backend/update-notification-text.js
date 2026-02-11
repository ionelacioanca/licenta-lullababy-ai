import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GrowthNotification from './models/GrowthNotification.js';
import Baby from './models/Baby.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const updateNotificationText = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    const marcelId = '698c4f4ccdb5b46d7dbea206';
    const baby = await Baby.findById(marcelId);

    if (!baby) {
      console.log('❌ Baby not found!');
      return;
    }

    // Find all notifications for Marcel
    const notifications = await GrowthNotification.find({ 
      babyId: marcelId,
      status: { $in: ['sent', 'pending'] }
    });

    console.log(`📊 Found ${notifications.length} notifications to update\n`);

    for (const notif of notifications) {
      console.log(`Updating notification ${notif._id}:`);
      console.log(`  Old title: "${notif.title}"`);
      console.log(`  Old body: "${notif.body}"`);

      // Update title and body
      notif.title = `Time to measure ${baby.name}`;
      notif.body = `${baby.name} is ${notif.ageInMonths} month${notif.ageInMonths > 1 ? 's' : ''} old. Record weight and length.`;
      
      await notif.save();

      console.log(`  New title: "${notif.title}"`);
      console.log(`  New body: "${notif.body}"`);
      console.log('  ✅ Updated!\n');
    }

    console.log('🎉 All notifications updated!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

updateNotificationText();
