import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.50:5000/api/growth-notifications';

export interface GrowthNotification {
  _id: string;
  babyId: {
    _id: string;
    name: string;
    avatarColor?: string;
    avatarImage?: string;
  };
  userId: string;
  scheduledDate: string;
  type: string;
  status: 'pending' | 'sent' | 'dismissed' | 'completed';
  title: string;
  body: string;
  read: boolean;
  readAt?: string;
  sentAt?: string;
  completedAt?: string;
  ageInMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: GrowthNotification[];
  unreadCount: number;
  total: number;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const growthNotificationService = {
  /**
   * Get all notifications for the current user
   */
  async getUserNotifications(includeRead: boolean = true, limit: number = 50, skip: number = 0): Promise<NotificationResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(BASE_URL, {
        headers,
        params: { includeRead, limit, skip }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${BASE_URL}/unread-count`, { headers });
      return response.data.data.unreadCount;
    } catch (error: any) {
      console.error('Error fetching unread count:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<GrowthNotification> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(`${BASE_URL}/${notificationId}/read`, {}, { headers });
      return response.data.data;
    } catch (error: any) {
      console.error('Error marking notification as read:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mark a notification as completed
   */
  async markAsCompleted(notificationId: string): Promise<GrowthNotification> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(`${BASE_URL}/${notificationId}/complete`, {}, { headers });
      return response.data.data;
    } catch (error: any) {
      console.error('Error marking notification as completed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Dismiss a notification
   */
  async dismissNotification(notificationId: string): Promise<GrowthNotification> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(`${BASE_URL}/${notificationId}/dismiss`, {}, { headers });
      return response.data.data;
    } catch (error: any) {
      console.error('Error dismissing notification:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Schedule initial notifications for a baby
   */
  async scheduleInitialNotifications(babyId: string): Promise<GrowthNotification[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${BASE_URL}/${babyId}/schedule`, {}, { headers });
      return response.data.data;
    } catch (error: any) {
      console.error('Error scheduling notifications:', error.response?.data || error.message);
      throw error;
    }
  },
};
