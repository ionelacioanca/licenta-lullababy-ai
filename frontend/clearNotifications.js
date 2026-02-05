// Run this script to clear all notifications
// In Expo: run this in the console or create a button to call it

import * as Notifications from 'expo-notifications';

export async function clearAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    console.log('✅ All notifications cleared!');
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  }
}

// Uncomment to run immediately
// clearAllNotifications();
