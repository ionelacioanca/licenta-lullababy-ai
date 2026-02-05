import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface MediaNotificationConfig {
  title: string;
  artist?: string;
  album?: string;
  imageUrl?: string;
  isPlaying: boolean;
  duration?: number;
  position?: number;
  audioUrl?: string;
  volume?: number; // Added volume
}

// Lazy import notifications to avoid Expo Go errors
let Notifications: any = null;
let notificationsAvailable = false;

// Try to load notifications module
try {
  Notifications = require('expo-notifications');
  notificationsAvailable = true;
  
  // Configure notification handler only if available
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  // Set up notification categories with actions (for iOS and some Android versions)
  // Simplified controls: STOP + Volume only (no Next/Previous)
  if (Notifications && Notifications.setNotificationCategoryAsync) {
    Notifications.setNotificationCategoryAsync('media_controls', [
      {
        identifier: 'play_pause',
        buttonTitle: 'Stop',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'volume_down',
        buttonTitle: 'Vol -',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'volume_up',
        buttonTitle: 'Vol +',
        options: {
          opensAppToForeground: false,
        },
      },
    ]).catch((err: any) => {
      console.log('Could not set notification categories:', err);
    });
  }
} catch (error) {
  console.log('Notifications not available in this environment (Expo Go)');
  notificationsAvailable = false;
}

class MediaNotificationService {
  private isInitialized: boolean = false;
  private notificationId: string | null = null;
  private onPlayPause: (() => void) | null = null;
  private onNext: (() => void) | null = null;
  private onPrevious: (() => void) | null = null;
  private onVolumeUp: (() => void) | null = null;
  private onVolumeDown: (() => void) | null = null;
  private lastNotificationState: string = ''; // Track last state to avoid duplicates
  private responseSubscription: any = null;

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Skip notifications if not available (Expo Go)
      if (!notificationsAvailable || !Notifications) {
        console.log('Notifications disabled - use development build for full media controls');
        this.isInitialized = true;
        
        // Still configure audio for background playback
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        return true;
      }

      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        // Continue anyway - user can still use the app
      }

      // Configure audio for background playback
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create Android notification channel with green color
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        try {
          await Notifications.setNotificationChannelAsync('media', {
            name: 'Media Playback',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0],
            lightColor: '#A2E884', // LullaBaby green
            sound: null,
            enableVibrate: false,
            showBadge: false,
          });
          console.log('✅ Android notification channel created with green theme');
        } catch (err) {
          console.log('Could not set notification channel:', err);
        }
      }

      // Set up notification response listener
      this.setupNotificationListener();

      this.isInitialized = true;
      console.log('Media notification service initialized');

      return true;
    } catch (error) {
      console.error('Failed to initialize media notifications:', error);
      this.isInitialized = true; // Mark as initialized to prevent retries
      return false;
    }
  }

  private setupNotificationListener() {
    if (!notificationsAvailable || !Notifications) {
      return;
    }

    // Clean up existing subscription
    if (this.responseSubscription) {
      this.responseSubscription.remove();
    }

    // Listen for notification interactions
    this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const actionId = response.actionIdentifier;
        
        console.log('🔔 Notification action received:', actionId);
        console.log('🔔 Full response:', JSON.stringify(response, null, 2));
        console.log('🔔 Handlers registered:', {
          playPause: !!this.onPlayPause,
          next: !!this.onNext,
          previous: !!this.onPrevious,
          volumeUp: !!this.onVolumeUp,
          volumeDown: !!this.onVolumeDown,
        });
        
        switch (actionId) {
          case 'play_pause':
            console.log('🎵 Calling play/pause handler');
            if (this.onPlayPause) {
              this.onPlayPause();
              console.log('✅ Play/pause handler executed');
            } else {
              console.warn('❌ Play/pause handler not registered!');
            }
            break;
          case 'next':
            console.log('⏭️ Calling next handler');
            if (this.onNext) {
              this.onNext();
              console.log('✅ Next handler executed');
            } else {
              console.warn('❌ Next handler not registered!');
            }
            break;
          case 'previous':
            console.log('⏮️ Calling previous handler');
            if (this.onPrevious) {
              this.onPrevious();
              console.log('✅ Previous handler executed');
            } else {
              console.warn('❌ Previous handler not registered!');
            }
            break;
          case 'volume_up':
            console.log('🔊 Calling volume up handler');
            if (this.onVolumeUp) {
              this.onVolumeUp();
              console.log('✅ Volume up handler executed');
            } else {
              console.warn('❌ Volume up handler not registered!');
            }
            break;
          case 'volume_down':
            console.log('🔉 Calling volume down handler');
            if (this.onVolumeDown) {
              this.onVolumeDown();
              console.log('✅ Volume down handler executed');
            } else {
              console.warn('❌ Volume down handler not registered!');
            }
            break;
          default:
            console.log('❓ Unknown action identifier:', actionId);
            // Handle tap on notification body (no specific action)
            if (actionId === 'DEFAULT' || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
              console.log('📱 User tapped notification body - opening app');
            }
        }
      }
    );
  }

  registerHandlers(
    onPlayPause: () => void,
    onNext: () => void,
    onPrevious: () => void,
    onVolumeUp?: () => void,
    onVolumeDown?: () => void
  ) {
    this.onPlayPause = onPlayPause;
    this.onNext = onNext;
    this.onPrevious = onPrevious;
    this.onVolumeUp = onVolumeUp || null;
    this.onVolumeDown = onVolumeDown || null;
  }

  async showMediaNotification(config: MediaNotificationConfig) {
    try {
      // Skip if notifications not available
      if (!notificationsAvailable || !Notifications) {
        console.log('Notifications not available - skipping');
        return null;
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        title,
        artist = 'LullaBaby',
        isPlaying,
        volume = 0.7,
      } = config;

      // Create a unique state string to detect changes
      const currentState = `${title}|${artist}|${isPlaying}|${Math.round(volume * 100)}`;
      
      // Only update notification if state actually changed
      if (currentState === this.lastNotificationState) {
        console.log('Notification state unchanged - skipping update');
        return this.notificationId;
      }
      
      this.lastNotificationState = currentState;

      // Dismiss previous notification if exists
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
      }

      const volumePercent = Math.round(volume * 100);

      // Build notification content based on platform
      const content: any = {
        title: `${isPlaying ? '🎵' : '⏸'} ${title}`,
        body: `${artist} • Volume ${volumePercent}%`,
        data: { 
          type: 'media', 
          isPlaying,
          volume: volumePercent,
        },
        sticky: false, // Allow user to dismiss notification with swipe
        priority: Notifications.AndroidNotificationPriority.MAX,
        sound: false,
      };

      if (Platform.OS === 'android') {
        content.priority = Notifications.AndroidNotificationPriority.MAX;
        content.channelId = 'media';
        content.categoryIdentifier = 'media_controls';
        content.color = '#A2E884'; // LullaBaby green theme
      } else {
        // iOS supports categories with actions
        content.categoryIdentifier = 'media_controls';
        content.color = '#A2E884';
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null, // Show immediately
      });

      this.notificationId = notificationId;
      console.log('Media notification shown:', notificationId, 'Volume:', volumePercent + '%');

      return notificationId;
    } catch (error) {
      console.error('Failed to show media notification:', error);
      return null;
    }
  }

  async updatePlaybackState(isPlaying: boolean) {
    // This would update the notification state
    console.log('Playback state updated:', isPlaying);
  }

  async updateMediaNotification(config: MediaNotificationConfig) {
    // Show new notification with updated state
    return await this.showMediaNotification(config);
  }

  async updatePosition(position: number) {
    // Position updates are not shown in basic notifications
  }

  async hideMediaNotification() {
    try {
      if (!notificationsAvailable || !Notifications) {
        return;
      }

      if (this.notificationId) {
        const idToRemove = this.notificationId;
        this.notificationId = null; // Clear immediately to prevent double-calls
        this.lastNotificationState = ''; // Reset state
        
        try {
          // Cancel the scheduled notification (removes it completely)
          await Notifications.cancelScheduledNotificationAsync(idToRemove);
        } catch (err) {
          // Ignore if notification is not scheduled anymore
          console.log('Could not cancel scheduled notification (may already be shown)');
        }
        
        try {
          // Also dismiss from notification tray
          await Notifications.dismissNotificationAsync(idToRemove);
        } catch (err) {
          // Ignore if notification is already dismissed
          console.log('Could not dismiss notification (may already be dismissed)');
        }
        
        console.log('Media notification hidden');
      }
    } catch (error) {
      console.error('Failed to hide media notification:', error);
    }
  }

  async clearAllNotifications() {
    try {
      if (!notificationsAvailable || !Notifications) {
        return;
      }

      // Cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      // Dismiss all present notifications
      await Notifications.dismissAllNotificationsAsync();
      this.notificationId = null;
      this.lastNotificationState = '';
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  async cleanup() {
    try {
      // Remove notification listener
      if (this.responseSubscription) {
        this.responseSubscription.remove();
        this.responseSubscription = null;
      }
      
      await this.hideMediaNotification();
      this.isInitialized = false;
      this.lastNotificationState = '';
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  }
}

export const mediaNotificationService = new MediaNotificationService();
