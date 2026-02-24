import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = 'http://192.168.1.50:5000/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const pushNotificationService = {
  /**
   * Initialize push notifications - registers device and sends token to backend
   */
  async initialize() {
    try {
      console.log('🚀 Starting push notification initialization...');

      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('📱 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.error('❌ Notification permissions not granted');
        return null;
      }

      console.log('✅ Notification permissions granted');

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.error('❌ Project ID not found in app configuration');
        return null;
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('📱 Expo Push Token:', pushToken.data);

      // Send token to backend
      await this.registerPushToken(pushToken.data);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return pushToken.data;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return null;
    }
  },

  /**
   * Register push token with backend
   */
  async registerPushToken(pushToken: string) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No auth token found - cannot register push token');
        return;
      }

      console.log('📤 Registering push token with backend...');

      const response = await fetch(`${API_URL}/register-push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pushToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to register push token: ${response.status}`, errorText);
        return;
      }

      const data = await response.json();
      console.log('✅ Push token registered successfully:', data);
    } catch (error) {
      console.error('❌ Error registering push token:', error);
    }
  },

  /**
   * Unregister push token (for logout)
   */
  async unregisterPushToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        return;
      }

      console.log('📤 Unregistering push token...');

      await fetch(`${API_URL}/unregister-push-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('✅ Push token unregistered');
    } catch (error) {
      console.error('❌ Error unregistering push token:', error);
    }
  },
};
