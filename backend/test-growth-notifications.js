// Test script for growth notification system
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Baby from './models/Baby.js';
import User from './models/User.js';
import GrowthNotification from './models/GrowthNotification.js';
import growthNotificationService from './services/growthNotificationService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lullababy';

async function testGrowthNotifications() {
  try {
    console.log('🧪 Testing Growth Notification System\n');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Test: Calculate next measurement date
    console.log('📅 Test 1: Calculate next measurement date');
    const testBirthDate = new Date('2024-01-15');
    
    // Test for 0-6 months (should be monthly)
    const result1 = growthNotificationService.calculateNextMeasurementDate(testBirthDate, new Date('2024-02-15'));
    console.log(`  0-6 months: Next date in ${result1.intervalMonths} month(s) - ${result1.date.toDateString()}`);
    
    // Test for 6-12 months (should be every 2 months)
    const result2 = growthNotificationService.calculateNextMeasurementDate(testBirthDate, new Date('2024-08-15'));
    console.log(`  6-12 months: Next date in ${result2.intervalMonths} month(s) - ${result2.date.toDateString()}`);
    
    // Test for 12+ months (should be every 3 months)
    const result3 = growthNotificationService.calculateNextMeasurementDate(testBirthDate, new Date('2025-02-15'));
    console.log(`  12+ months: Next date in ${result3.intervalMonths} month(s) - ${result3.date.toDateString()}\n`);

    // 2. Test: Find a test baby
    console.log('👶 Test 2: Finding test baby');
    const testBaby = await Baby.findOne().populate('parentId');
    if (!testBaby) {
      console.log('  ⚠️  No babies found. Create a baby first.\n');
      return;
    }
    console.log(`  Found baby: ${testBaby.name} (ID: ${testBaby._id})`);
    console.log(`  Birth date: ${testBaby.birthDate.toDateString()}\n`);

    // 3. Test: Schedule initial notifications
    console.log('📬 Test 3: Schedule initial notifications');
    
    // Clean up existing notifications for this baby
    await GrowthNotification.deleteMany({ babyId: testBaby._id });
    console.log('  Cleaned up existing notifications');
    
    const notifications = await growthNotificationService.scheduleInitialNotifications(testBaby._id);
    console.log(`  ✅ Scheduled ${notifications.length} notification(s)`);
    notifications.forEach(notif => {
      console.log(`    - For user ${notif.userId}, scheduled for ${notif.scheduledDate.toDateString()}`);
    });
    console.log();

    // 4. Test: Get user notifications
    console.log('📋 Test 4: Get user notifications');
    if (testBaby.parentId) {
      const userNotifs = await growthNotificationService.getUserNotifications(testBaby.parentId._id);
      console.log(`  Found ${userNotifs.notifications.length} notification(s)`);
      console.log(`  Unread count: ${userNotifs.unreadCount}\n`);
    }

    // 5. Test: Simulate sending pending notifications
    console.log('📨 Test 5: Simulate sending pending notifications');
    // Set one notification to be "ready to send" (past due)
    const testNotification = await GrowthNotification.findOne({ babyId: testBaby._id, status: 'pending' });
    if (testNotification) {
      testNotification.scheduledDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await testNotification.save();
      console.log('  Set notification to past due');
      
      const results = await growthNotificationService.sendPendingNotifications();
      console.log(`  Results: ${results.sent} sent, ${results.failed} failed\n`);
    } else {
      console.log('  No pending notifications found\n');
    }

    // 6. Test: Mark notification as completed
    console.log('✅ Test 6: Mark notification as completed');
    const sentNotification = await GrowthNotification.findOne({ 
      babyId: testBaby._id, 
      status: 'sent' 
    });
    
    if (sentNotification && testBaby.parentId) {
      await growthNotificationService.markAsCompleted(sentNotification._id, testBaby.parentId._id);
      console.log('  ✅ Notification marked as completed');
      console.log('  Next notification should be scheduled automatically\n');
      
      // Check if next notification was created
      const futureNotifs = await GrowthNotification.find({
        babyId: testBaby._id,
        userId: testBaby.parentId._id,
        status: 'pending',
        scheduledDate: { $gte: new Date() }
      });
      console.log(`  Future notifications: ${futureNotifs.length}`);
      futureNotifs.forEach(notif => {
        console.log(`    - Scheduled for ${notif.scheduledDate.toDateString()}`);
      });
    } else {
      console.log('  No sent notifications to test with\n');
    }

    console.log('\n🎉 All tests completed!');
    
    // Display summary
    console.log('\n📊 Summary:');
    const allNotifications = await GrowthNotification.find({ babyId: testBaby._id });
    console.log(`  Total notifications: ${allNotifications.length}`);
    console.log(`  Pending: ${allNotifications.filter(n => n.status === 'pending').length}`);
    console.log(`  Sent: ${allNotifications.filter(n => n.status === 'sent').length}`);
    console.log(`  Completed: ${allNotifications.filter(n => n.status === 'completed').length}`);
    console.log(`  Dismissed: ${allNotifications.filter(n => n.status === 'dismissed').length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run tests
testGrowthNotifications();
