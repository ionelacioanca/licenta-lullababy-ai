import mongoose from 'mongoose';
import dotenv from 'dotenv';
import growthNotificationService from './services/growthNotificationService.js';
import Baby from './models/Baby.js';
import User from './models/User.js';
import GrowthNotification from './models/GrowthNotification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const testGetNotifications = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    const userId = '69258e3786bdce50e37598f1'; // Parent ID for Marcel
    
    console.log('🔍 Testing getUserNotifications for userId:', userId);
    console.log('This simulates what the frontend API call does.\n');

    // First, check the user
    const user = await User.findById(userId);
    console.log('👤 User:', {
      id: user?._id,
      email: user?.email,
      relatedParentId: user?.relatedParentId,
      relatedParentIds: user?.relatedParentIds
    });

    // Check what babies this user has access to
    const parentIds = [userId];
    if (user?.relatedParentIds?.length > 0) {
      parentIds.push(...user.relatedParentIds);
    }
    if (user?.relatedParentId) {
      parentIds.push(user.relatedParentId);
    }
    
    console.log('\n📋 Parent IDs to check:', parentIds.map(id => id.toString()));
    
    const babies = await Baby.find({ parentId: { $in: parentIds } });
    console.log(`\n👶 Babies accessible to user: ${babies.length}`);
    babies.forEach((baby, index) => {
      console.log(`${index + 1}. ${baby.name} (ID: ${baby._id})`);
    });
    
    const babyIds = babies.map(b => b._id);
    console.log('\n🔢 Baby IDs:', babyIds.map(id => id.toString()));

    // Check all notifications for these babies
    const allNotifications = await GrowthNotification.find({ 
      babyId: { $in: babyIds }
    }).sort({ scheduledDate: -1 });
    
    console.log(`\n📊 All notifications for these babies: ${allNotifications.length}`);
    allNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - Status: ${notif.status}, Read: ${notif.read}, Age: ${notif.ageInMonths}mo`);
    });

    // Now test with status filter (sent/dismissed only)
    const sentNotifications = await GrowthNotification.find({ 
      babyId: { $in: babyIds },
      status: { $in: ['sent', 'dismissed'] }
    }).sort({ scheduledDate: -1 });
    
    console.log(`\n✅ Notifications with status 'sent' or 'dismissed': ${sentNotifications.length}`);
    sentNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - Status: ${notif.status}, Read: ${notif.read}, Age: ${notif.ageInMonths}mo`);
    });

    // Call the actual service method
    console.log('\n🎯 Calling growthNotificationService.getUserNotifications()...\n');
    const result = await growthNotificationService.getUserNotifications(userId, {
      includeRead: true,
      limit: 50,
      skip: 0
    });

    console.log('📦 Result from service:');
    console.log('  - notifications:', result.notifications.length);
    console.log('  - unreadCount:', result.unreadCount);
    console.log('  - total:', result.total);
    
    if (result.notifications.length > 0) {
      console.log('\n📋 Notifications details:');
      result.notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`);
        console.log(`   - Baby: ${notif.babyId?.name || 'N/A'}`);
        console.log(`   - Status: ${notif.status}`);
        console.log(`   - Read: ${notif.read}`);
        console.log(`   - Scheduled: ${notif.scheduledDate}`);
      });
    } else {
      console.log('\n⚠️ No notifications returned!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

testGetNotifications();
