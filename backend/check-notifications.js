import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GrowthNotification from './models/GrowthNotification.js';
import Baby from './models/Baby.js';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const checkNotifications = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    // List all babies
    const allBabies = await Baby.find({}).limit(10);
    console.log(`📋 Found ${allBabies.length} babies in DB:`);
    allBabies.forEach((baby, index) => {
      console.log(`${index + 1}. ${baby.name} (ID: ${baby._id}, Parent: ${baby.parentId}, Born: ${baby.birthDate})`);
    });
    console.log('');

    // Try to find Marcel by ID from test script
    const marcelId = '698c4f4ccdb5b46d7dbea206';
    const marcel = await Baby.findById(marcelId);
    console.log('👶 Marcel by ID:', {
      id: marcel?._id,
      name: marcel?.name,
      birthDate: marcel?.birthDate,
      parentId: marcel?.parentId
    });

    if (!marcel) {
      console.log('❌ Marcel not found by ID either!');
      console.log('Using first baby from list if available...\n');
      
      if (allBabies.length === 0) {
        console.log('No babies in database!');
        return;
      }
    }
    
    const targetBaby = marcel || allBabies[0];
    if (!targetBaby) return;

    // Find all notifications for this baby
    console.log(`\n📊 Searching for notifications for ${targetBaby.name} (${targetBaby._id})...`);
    const notifications = await GrowthNotification.find({ babyId: targetBaby._id })
      .sort({ scheduledDate: -1 });
    
    console.log(`Found ${notifications.length} notifications:\n`);
    
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. Notification ${notif._id}:`);
      console.log(`   - userId: ${notif.userId}`);
      console.log(`   - babyId: ${notif.babyId}`);
      console.log(`   - scheduledDate: ${notif.scheduledDate}`);
      console.log(`   - status: ${notif.status}`);
      console.log(`   - read: ${notif.read}`);
      console.log(`   - ageInMonths: ${notif.ageInMonths}`);
      console.log(`   - title: ${notif.title}`);
      console.log('');
    });

    // Find the parent user
    if (targetBaby.parentId) {
      const parent = await User.findById(targetBaby.parentId);
      console.log('👤 Parent user:', {
        id: parent?._id,
        email: parent?.email,
        name: parent?.name,
        relatedParentId: parent?.relatedParentId,
        relatedParentIds: parent?.relatedParentIds
      });
    }

    // Check all notifications in DB (not just Marcel's)
    const allNotifications = await GrowthNotification.find({}).limit(10);
    console.log(`\n📋 Total notifications in DB: ${allNotifications.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

checkNotifications();
