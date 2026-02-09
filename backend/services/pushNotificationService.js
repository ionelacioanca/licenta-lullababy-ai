import { Expo } from 'expo-server-sdk';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = join(__dirname, '../config/firebase-admin-key.json');

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.warn('⚠️ Firebase Admin credentials not found at:', serviceAccountPath);
    console.warn('⚠️ Push notifications will use Expo without FCM (may have limitations)');
  }
}

// Create a new Expo SDK client
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true // Use FCM API v1 with Firebase Admin
});

/**
 * Send push notification to a user
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
export async function sendPushNotification(pushToken, title, body, data = {}) {
  try {
    // Check if the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return { success: false, error: 'Invalid push token' };
    }

    // Create the message
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'baby-alerts',
    };

    // Send the notification
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticket);

    return { success: true, ticket };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to multiple users
 * @param {Array<{pushToken: string, title: string, body: string, data: object}>} notifications
 */
export async function sendBulkPushNotifications(notifications) {
  try {
    const messages = [];

    for (const notification of notifications) {
      if (!Expo.isExpoPushToken(notification.pushToken)) {
        console.warn(`Skipping invalid push token: ${notification.pushToken}`);
        continue;
      }

      messages.push({
        to: notification.pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high',
        channelId: 'baby-alerts',
      });
    }

    // Split messages into chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    console.log(`Sent ${tickets.length} push notifications`);
    return { success: true, tickets };
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send motion detected notification
 * @param {string} pushToken - User's push token
 * @param {string} babyName - Baby's name
 */
export async function sendMotionDetectedNotification(pushToken, babyName = 'Baby') {
  return await sendPushNotification(
    pushToken,
    '🚼 Motion Detected',
    `${babyName} is moving! Check the baby monitor.`,
    { type: 'motion_detected', timestamp: Date.now() }
  );
}

/**
 * Send baby woke up notification
 * @param {string} pushToken - User's push token
 * @param {string} babyName - Baby's name
 */
export async function sendBabyWokeUpNotification(pushToken, babyName = 'Baby') {
  return await sendPushNotification(
    pushToken,
    '👶 Baby Woke Up',
    `${babyName} just woke up! They might need your attention.`,
    { type: 'baby_woke_up', timestamp: Date.now() }
  );
}

/**
 * Send baby crying notification
 * @param {string} pushToken - User's push token
 * @param {string} babyName - Baby's name
 */
export async function sendBabyCryingNotification(pushToken, babyName = 'Baby') {
  return await sendPushNotification(
    pushToken,
    '😢 Baby Crying',
    `${babyName} is crying! Check if they need anything.`,
    { type: 'baby_crying', timestamp: Date.now() }
  );
}
